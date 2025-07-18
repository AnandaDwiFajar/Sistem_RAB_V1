import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';

export const calculateWorkItem = (template, primaryInputValue, allMaterialPrices, parameterValues = {}) => {
    if (!template) throw new Error("Template is not defined.");

    const schema = CALCULATION_SCHEMAS[template.calculation_schema_type || 'SIMPLE_PRIMARY_INPUT'];
    if (!schema) throw new Error("Calculation schema not found.");

    const calculationResult = (typeof schema.calculate === 'function' && !schema.isSimple) ? schema.calculate(parameterValues) : null;

    let primaryQuantity;
    if (schema.isSimple) {
        primaryQuantity = parseFloat(primaryInputValue) || 0;
    } else if (calculationResult !== null) {
        // If the result is a number, use it. If it's a descriptive string, the quantity is bundled, so we use 1 as the multiplier.
        primaryQuantity = (typeof calculationResult === 'number' && isFinite(calculationResult)) ? calculationResult : 1;
    } else {
        primaryQuantity = 0;
    }

    const evaluatedComponents = (template.components || []).map(comp => {
        const materialPrice = allMaterialPrices.find(p => p.id === comp.material_price_id);
        if (!materialPrice && comp.component_type !== 'info') {
            return { ...comp, quantity_calculated: 0, cost_calculated: 0, error: 'Price not found' };
        }

        const coefficient = parseFloat(comp.coefficient) || 0;
        const price = parseFloat(materialPrice?.price) || 0;

        const quantity_calculated = coefficient * primaryQuantity;
        const cost_calculated = comp.component_type === 'info' ? 0 : quantity_calculated * price;

        return {
            ...comp,
            component_name_snapshot: comp.display_name,
            price_per_unit_snapshot: comp.component_type === 'info' ? 0 : price,
            unit_snapshot: materialPrice?.unit || 'unit',
            quantity_calculated,
            cost_calculated,
        };
    });

    const totalItemCost = evaluatedComponents.reduce((sum, comp) => sum + (comp.cost_calculated || 0), 0);
    const totalQuantity = calculationResult !== null ? calculationResult : primaryQuantity;

    return {
        ...template,
        work_item_name: template.name,
        total_item_cost: totalItemCost,
        total_quantity: totalQuantity,
        unit: template.primary_input_unit_name,
        components: evaluatedComponents,
    };
};

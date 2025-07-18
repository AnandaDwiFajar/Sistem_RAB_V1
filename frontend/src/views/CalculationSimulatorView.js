import React, { useState } from 'react';
import { PlusCircle, Save, Trash2, ChevronDown, ChevronUp, Loader2, Pencil, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';

// Helper komponen untuk konsistensi form
const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-industrial-dark mb-1">{label}</label>
        {children}
    </div>
);
const FormInput = (props) => (
    <input {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent" />
);
const FormSelect = ({ children, ...props }) => (
    <select {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent">
        {children}
    </select>
);

const CalculationSimulatorView = ({
    definitionsManager = {},
    userWorkItemCategories = [],
    // Props simulasi
    workItemFormData = { templateKey: '', parameterValues: {}, primaryInputValue: '' },
    handleWorkItemFormChange,
    calculatedWorkItemPreview,
    handleCalculate,
    isCalculating,
}) => {
    const { userWorkItemTemplates = {} } = definitionsManager;
    const templatesArray = Object.values(userWorkItemTemplates);

    const templatesByCategory = templatesArray.reduce((acc, template) => {
        const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
        const categoryName = categoryObj ? categoryObj.category_name : 'Tidak Terkategori';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(template);
        return acc;
    }, {});

    const selectedTemplate = workItemFormData.templateKey ? userWorkItemTemplates[workItemFormData.templateKey] : null;
    const selectedSchema = selectedTemplate?.calculation_schema_type ? CALCULATION_SCHEMAS[selectedTemplate.calculation_schema_type] : null;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
                <div className="pb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-industrial-dark">Kalkulator Estimasi Biaya</h1>
                </div>
             <div className="p-6 bg-white border border-industrial-gray-light rounded-lg shadow-sm space-y-4 animate-fadeIn">
                <form onSubmit={(e) => { e.preventDefault(); handleCalculate(workItemFormData); }}>
                    <div className="space-y-4">
                        <FormField label="Pilih Item Pekerjaan">
                            <FormSelect name="templateKey" value={workItemFormData.templateKey} onChange={handleWorkItemFormChange}>
                                <option value="">-- Pilih Item Pekerjaan --</option>
                                {Object.entries(templatesByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([catName, templates]) => (
                                    <optgroup key={catName} label={catName}>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </optgroup>
                                ))}
                            </FormSelect>
                        </FormField>
                        
                        {/* Input dinamis berdasarkan skema */}
                        {selectedSchema && !selectedSchema.isSimple && selectedTemplate && selectedSchema.inputs.map(inputDef => (
                            <FormField key={inputDef.key} label={`${inputDef.label} ${inputDef.unitSymbol ? `(${inputDef.unitSymbol})` : ''}`}>
                                <FormInput
                                    type={inputDef.type || 'text'}
                                    value={workItemFormData.parameterValues[inputDef.key] || ''}
                                    onChange={(e) => handleWorkItemFormChange(e, inputDef.key)}
                                    placeholder={inputDef.placeholder || `Contoh: ${inputDef.defaultValue ?? '0.00'}`}
                                    step={inputDef.type === 'number' ? 'any' : undefined}
                                />
                            </FormField>
                        ))}
                        {selectedTemplate && (!selectedSchema || selectedSchema.isSimple) && (
                            <FormField label={`${selectedTemplate.primary_input_label || 'Input'} (${selectedTemplate.primary_input_unit_name || 'Unit'})`}>
                                    <FormInput type="number" name="primaryInputValue" value={workItemFormData.primaryInputValue} onChange={handleWorkItemFormChange} min="0" step="any" />
                            </FormField>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-industrial-gray-light">
                        <button type="submit" disabled={!workItemFormData.templateKey || isCalculating} className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark disabled:bg-industrial-gray">
                            {isCalculating ? <Loader2 size={18} className="animate-spin mr-2"/> : <Calculator size={18} className="mr-2"/>}
                            Hitung Estimasi
                        </button>
                    </div>
                </form>
            </div>
            
            {calculatedWorkItemPreview && (
                 <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-industrial-gray-light animate-fadeIn">
                    <h4 className="text-lg font-semibold text-industrial-dark mb-2">Hasil Estimasi</h4>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(calculatedWorkItemPreview.total_item_cost)}</p>
                    
                    <div className="mt-4 pt-3 border-t border-industrial-gray-light text-sm text-industrial-gray-dark">
                        <p className="font-semibold mb-2">Rincian Komponen:</p>
                        <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                            {(Array.isArray(calculatedWorkItemPreview.components) ? calculatedWorkItemPreview.components : []).map((comp, idx) => (
                                <li key={idx}>
                                    {comp.component_name_snapshot}: {parseFloat(comp.quantity_calculated).toFixed(2)} {comp.unit_snapshot} @ {formatCurrency(parseFloat(comp.price_per_unit_snapshot))} = <span className="font-medium">{formatCurrency(parseFloat(comp.cost_calculated))}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(CalculationSimulatorView);
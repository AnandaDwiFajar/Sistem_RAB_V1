import React, { useRef, useState } from 'react';
import { PlusCircle, Save, Trash2, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';
import { CSSTransition } from 'react-transition-group';
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

const ProjectWorkItemsView = ({
    currentProject,
    definitionsManager = {},
    userWorkItemCategories = [],
    // Props dari projectsManager
    showWorkItemForm,
    setShowWorkItemForm,
    workItemFormData,
    handleWorkItemFormChange,
    calculatedWorkItemPreview,
    setCalculatedWorkItemPreview,
    handleSaveWorkItem,
    isSavingWorkItem,
    handleDeleteWorkItem,
    editingWorkItemId,
    handleStartEditWorkItem,
    handleCancelEditWorkItem,
}) => {
    const formRef = useRef(null);
    const [openItemId, setOpenItemId] = useState(null);

    // Memastikan data dari props aman untuk digunakan
    if (!currentProject) return null;
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

    const handleToggleForm = () => {
        const newShowState = !showWorkItemForm;
        setShowWorkItemForm(newShowState);
        setCalculatedWorkItemPreview(null);
        handleWorkItemFormChange({ target: { name: 'templateKey', value: '' } });
    };

    const workItems = (currentProject.workItems || []).sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));

    return (
        <div className="space-y-6">
            {!currentProject.is_archived && (
                <div className="flex justify-end items-center">
                    <button
                        onClick={handleToggleForm}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                    >
                        <PlusCircle size={18} className="mr-2"/> {showWorkItemForm ? 'Batal Tambah' : 'Tambah Item Pekerjaan'}
                    </button>
                </div>
            )}

            <CSSTransition
                nodeRef={formRef}
                in={showWorkItemForm}
                timeout={500}
                classNames="form-transition"
                unmountOnExit
            >
                <div ref={formRef} className="p-6 bg-white border border-industrial-gray-light rounded-lg shadow-lg space-y-4 overflow-hidden">
                    <h3 className="text-xl font-bold text-industrial-accent pb-4 border-b border-industrial-gray-light">
                        {editingWorkItemId ? 'Edit Item Pekerjaan' : 'Tambah Item Pekerjaan Baru'}
                    </h3>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkItem(); }}>
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

                        {calculatedWorkItemPreview && (
                             <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-industrial-gray-light">
                                <h4 className="text-lg font-semibold text-industrial-dark mb-2">Pratinjau Biaya</h4>
                                <p className="text-md font-bold text-industrial-accent">{formatCurrency(calculatedWorkItemPreview.totalItemCost)}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-industrial-gray-light">
                             <button type="button" onClick={handleCancelEditWorkItem} className="px-5 py-2 text-sm font-medium text-industrial-dark bg-industrial-gray-light/50 border border-industrial-gray-light rounded-md hover:bg-industrial-gray-light">
                                Batal
                            </button>
                            <button type="submit" disabled={!calculatedWorkItemPreview || isSavingWorkItem} className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark disabled:bg-industrial-gray">
                                {isSavingWorkItem ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                                {editingWorkItemId ? 'Simpan Perubahan' : 'Tambahkan'}
                            </button>
                        </div>
                    </form>
                </div>
            </CSSTransition>
            
            {workItems.length > 0 ? (
                <div className="space-y-3">
                    {workItems.map(item => {
                        const isOpen = openItemId === item.id;
                        return (
                            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-industrial-gray-light">
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpenItemId(isOpen ? null : item.id)}>
                                    <span className="font-semibold text-industrial-dark">{item.definition_name_snapshot}</span>
                                    <div className="flex items-center">
                                        <span className="font-bold text-green-600 mr-4">{formatCurrency(parseFloat(item.total_item_cost_snapshot))}</span>
                                        {!currentProject.is_archived && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); handleStartEditWorkItem(item); }} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent" title="Edit"><Pencil size={16}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkItem(item.id); }} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={16}/></button>
                                            </>
                                        )}
                                        {isOpen ? <ChevronUp size={20} className="ml-2 text-industrial-gray" /> : <ChevronDown size={20} className="ml-2 text-industrial-gray" />}
                                    </div>
                                </div>
                                {isOpen && (
                                    <div className="mt-4 pt-3 border-t border-industrial-gray-light text-sm text-industrial-gray-dark">
                                        <p className="font-semibold mb-2">Rincian Komponen:</p>
                                        <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                                            {(Array.isArray(item.components_snapshot) ? item.components_snapshot : []).map((comp, idx) => (
                                                <li key={idx}>
                                                    {comp.component_name_snapshot}: {parseFloat(comp.quantity_calculated).toFixed(2)} {comp.unit_snapshot} @ {formatCurrency(parseFloat(comp.price_per_unit_snapshot))} = <span className="font-medium">{formatCurrency(parseFloat(comp.cost_calculated))}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                !showWorkItemForm && <p className="text-center text-industrial-gray italic py-4">Belum ada item pekerjaan di proyek ini.</p>
            )}
        </div>
    );
};

export default React.memo(ProjectWorkItemsView);

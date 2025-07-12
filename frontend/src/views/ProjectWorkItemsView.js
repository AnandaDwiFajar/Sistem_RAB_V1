// src/components/ProjectWorkItemsView.js
import React from 'react';
import { PlusCircle, Save, Trash2, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { CALCULATION_SCHEMAS } from '../utils/calculationSchemas';

const ProjectWorkItemsViewComponent = ({
    currentProject,
    showWorkItemForm,
    setShowWorkItemForm,
    workItemFormData,
    handleWorkItemFormChange,
    userWorkItemTemplates,
    userWorkItemCategories,
    calculatedWorkItemPreview,
    setCalculatedWorkItemPreview,
    handleSaveWorkItem, 
    isAddingWorkItem,
    handleDeleteWorkItem,
    editingWorkItemId,
    isUpdatingWorkItem,
    handleStartEditWorkItem,
    handleCancelEditWorkItem,
}) => {
    if (!currentProject) return null;

    const templatesArray = Object.values(userWorkItemTemplates);
    const templatesByCategory = templatesArray.reduce((acc, template) => {
        const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
        const categoryName = categoryObj ? categoryObj.category_name : 'Tidak ada kategori';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(template);
        return acc;
    }, {});

    const selectedTemplate = workItemFormData.templateKey ? userWorkItemTemplates[workItemFormData.templateKey] : null;
    const selectedSchema = selectedTemplate && selectedTemplate.calculation_schema_type ? CALCULATION_SCHEMAS[selectedTemplate.calculation_schema_type] : null;

    const handleToggleForm = () => {
        if (showWorkItemForm) {
            // Jika form sedang terbuka, panggil cancel untuk mereset semuanya
            handleCancelEditWorkItem();
        } else {
            // Jika form tertutup, buka form kosong
            setShowWorkItemForm(true);
        }
    };

    
    return (
        <div className="space-y-6 animate-fadeIn">
            {!currentProject.is_archived && (
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <h4 className="text-xl font-medium text-gray-700">Item Pekerjaan dalam Proyek:</h4>
                    <button
                        onClick={handleToggleForm}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md shadow-sm flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        <PlusCircle size={20} className="mr-2"/> {showWorkItemForm ? 'Batal' : 'Tambah Item Pekerjaan'}
                    </button>
                </div>
            )}

            {showWorkItemForm && !currentProject.is_archived && (
                <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                    <h4 className="text-xl font-medium text-gray-700">
                        {editingWorkItemId ? 'Edit Item Pekerjaan' : 'Tambahkan Item Pekerjaan Baru'}
                    </h4>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkItem(); }}>
                        <div className="mb-4">
                            <label htmlFor="templateKeyWI" className="block text-sm font-medium text-gray-600 mb-1">Definisi Item Pekerjaan (Template)</label>
                            <select
                                id="templateKeyWI"
                                name="templateKey"
                                value={workItemFormData.templateKey}
                                onChange={handleWorkItemFormChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            >
                                <option value="">-- Pilih Jenis Item Pekerjaan --</option>
                                {templatesArray.length === 0 && <option disabled>Tidak ada definisi dimuat</option>}
                                {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoryName, templates]) => (
                                    <optgroup label={categoryName} key={categoryName} className="bg-gray-100 text-sky-700 font-semibold">
                                        {templates.sort((a, b) => a.name.localeCompare(b.name)).map(template => (
                                            <option key={template.id} value={template.id} className="text-gray-700 bg-white hover:bg-gray-50">{template.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        {selectedSchema && !selectedSchema.isSimple && selectedTemplate && selectedSchema.inputs.map(inputDef => (
                            <div key={inputDef.key} className="mb-3">
                                <label htmlFor={`param_wi_${inputDef.key}`} className="block text-sm font-medium text-gray-600 mb-1">
                                    {inputDef.label} {inputDef.unitSymbol && `(${inputDef.unitSymbol})`}
                                </label>
                                <input
                                    type={inputDef.type || 'text'}
                                    id={`param_wi_${inputDef.key}`}
                                    value={workItemFormData.parameterValues[inputDef.key] || ''}
                                    onChange={(e) => handleWorkItemFormChange(e, inputDef.key)}
                                    placeholder={inputDef.placeholder || `Contoh: ${inputDef.defaultValue !== undefined ? inputDef.defaultValue : '0.00'}`}
                                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                    step={inputDef.type === 'number' ? 'any' : undefined}
                                />
                            </div>
                        ))}


                        {selectedTemplate && (!selectedSchema || selectedSchema.isSimple) && (
                            <div className="mb-3">
                                <label htmlFor="primaryInputValueWI" className="block text-sm font-medium text-gray-600 mb-1">
                                    {selectedTemplate.primary_input_label || CALCULATION_SCHEMAS.SIMPLE_PRIMARY_INPUT.output.label}
                                    {' '}
                                    ({selectedTemplate.primary_input_unit_name || CALCULATION_SCHEMAS.SIMPLE_PRIMARY_INPUT.output.unit || 'Unit'})
                                </label>
                                <input
                                    type="number"
                                    id="primaryInputValueWI"
                                    name="primaryInputValue"
                                    value={workItemFormData.primaryInputValue}
                                    onChange={handleWorkItemFormChange}
                                    placeholder={`Input ${selectedTemplate.primary_input_label || 'Nilai'}`}
                                    min="0.001" step="any"
                                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                        )}

                        {calculatedWorkItemPreview && selectedTemplate && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                                <h5 className="text-lg font-semibold text-sky-700 mb-3">Pratinjau Perhitungan: {calculatedWorkItemPreview.name}</h5>

                                {calculatedWorkItemPreview.inputDetails?.type === 'schema' && calculatedWorkItemPreview.calculationSchemaType && CALCULATION_SCHEMAS[calculatedWorkItemPreview.calculationSchemaType] && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-700 font-medium">Parameter Input yang Digunakan:</p>
                                        <ul className="list-disc list-inside text-xs text-gray-600 pl-4 mt-1 space-y-0.5">
                                            {CALCULATION_SCHEMAS[calculatedWorkItemPreview.calculationSchemaType].inputs.map(inputDef => (
                                                <li key={inputDef.key}>
                                                    {inputDef.label}:
                                                    <strong className="ml-1 text-gray-800">
                                                        {calculatedWorkItemPreview.inputDetails.parametersSnapshot[inputDef.key] !== undefined && calculatedWorkItemPreview.inputDetails.parametersSnapshot[inputDef.key] !== '' ?
                                                            calculatedWorkItemPreview.inputDetails.parametersSnapshot[inputDef.key] :
                                                            (calculatedWorkItemPreview.inputDetails.parsedParameters[inputDef.key] !== undefined ?
                                                                String(calculatedWorkItemPreview.inputDetails.parsedParameters[inputDef.key]) + ' (default)' :
                                                                'N/A')}
                                                    </strong>
                                                    {' '}{inputDef.unitSymbol}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {calculatedWorkItemPreview.inputDetails?.type === 'simple' && (
                                    <p className="text-sm text-gray-700 font-medium mb-3">
                                        Input Utama: <strong className="text-gray-800">{calculatedWorkItemPreview.inputDetails.primaryInputValue}</strong> {calculatedWorkItemPreview.inputDetails.primaryInputUnit}
                                    </p>
                                )}

                                <p className="text-sm font-medium text-gray-700">
                                    Hasil Perhitungan ({calculatedWorkItemPreview.outputDetails?.label || 'Hasil'}):
                                    <span className="block text-xl sm:text-2xl text-emerald-600 font-bold mt-1">
                                        {typeof calculatedWorkItemPreview.outputDetails?.value === 'number' ?
                                            calculatedWorkItemPreview.outputDetails.value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) :
                                            'N/A'}
                                        <span className="text-sm ml-1.5 text-gray-500 font-normal">{calculatedWorkItemPreview.outputDetails?.unit}</span>
                                    </span>
                                </p>

                                {calculatedWorkItemPreview.components && calculatedWorkItemPreview.components.length > 0 && (
                                    <div className="mt-3.5">
                                        <p className="text-sm text-gray-700 font-medium mb-1.5">Rincian Biaya Komponen:</p>
                                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 text-xs border-t border-gray-300 pt-2.5">
                                            {calculatedWorkItemPreview.components.map((comp, idx) => (
                                                <div key={idx} className={`grid grid-cols-3 gap-2 items-center p-1.5 rounded ${comp.pricePerUnit === 0 && comp.component_type !== 'info' ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-100 border border-gray-200'}`}>
                                                    <span className={`col-span-2 truncate ${comp.pricePerUnit === 0 && comp.component_type !== 'info' ? 'text-yellow-700' : 'text-gray-700'}`} title={comp.name}>{comp.name}</span>
                                                    <span className={`text-right font-medium ${comp.pricePerUnit === 0 && comp.component_type !== 'info' ? 'text-yellow-800' : 'text-emerald-700'}`}>{formatCurrency(comp.cost)}</span>
                                                    {comp.pricePerUnit === 0 && comp.component_type !== 'info' && <span className="col-span-3 text-center text-yellow-600 text-[0.7rem] italic">(Harga Rp 0 atau tidak ditemukan)</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p className="text-md sm:text-lg font-semibold text-gray-800 mt-3.5 pt-3 border-t border-gray-300">
                                    Total Biaya Item Pekerjaan: <span className="text-emerald-600">{formatCurrency(calculatedWorkItemPreview.totalItemCost)}</span>
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelEditWorkItem}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={!calculatedWorkItemPreview || isAddingWorkItem || isUpdatingWorkItem || !workItemFormData.templateKey}
                                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {isAddingWorkItem ? (
                                    <><Loader2 className="animate-spin mr-2" size={20}/> Menambahkan...</>
                                ) : isUpdatingWorkItem ? (
                                    <><Loader2 className="animate-spin mr-2" size={20}/> Memperbarui...</>
                                ) : (
                                    <><Save size={18} className="mr-2"/>{editingWorkItemId ? 'Simpan Perubahan' : 'Tambahkan ke Proyek'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showWorkItemForm && (
                (currentProject.workItems || []).length > 0 ? (
                    <div className="space-y-4 mt-2">
                        {(currentProject.workItems || []).sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0)).map(item => (
                            <details key={item.id} className="bg-white p-3 sm:p-4 rounded-lg shadow-md group transition-all duration-300 ease-out hover:bg-gray-50 border border-gray-200">
                                <summary className="flex justify-between items-center cursor-pointer text-md sm:text-lg font-semibold text-sky-600 group-hover:text-sky-700 list-none">
                                    <div className="flex-grow">
                                        {item.definition_name_snapshot}
                                        <span className="block sm:inline text-xs sm:text-sm text-gray-500 sm:ml-2">
                                            ({ item.input_details_snapshot?.type === 'schema' && item.input_details_snapshot.outputLabel ?
                                                `${item.input_details_snapshot.outputLabel}: ${item.input_details_snapshot.outputValue?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.input_details_snapshot.outputUnit}` :
                                                item.primary_input_display_snapshot || 'Detail N/A'
                                            })
                                        </span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 ml-2">
                                        <span className="text-green-600 mr-2 sm:mr-4 font-semibold">{formatCurrency(parseFloat(item.total_item_cost_snapshot))}</span>
                                        {!currentProject.is_archived && (
                                            <>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStartEditWorkItem(item); }} 
                                                    className="p-1 text-sky-500 hover:text-sky-600 opacity-70 hover:opacity-100 transition-colors" 
                                                    title="Edit Item Pekerjaan">
                                                    <Pencil size={18}/>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteWorkItem(item.id); }} 
                                                    className="p-1 text-red-500 hover:text-red-600 opacity-70 hover:opacity-100 transition-colors mr-1 sm:mr-2" 
                                                    title="Hapus Item Pekerjaan">
                                                    <Trash2 size={18}/>
                                                </button>
                                            </>
                                        )}
                                        <ChevronDown size={24} className="group-open:hidden transition-transform duration-300 transform text-gray-400"/>
                                        <ChevronUp size={24} className="hidden group-open:block transition-transform duration-300 transform text-gray-400"/>
                                    </div>
                                </summary>
                                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 space-y-1.5 max-h-0 opacity-0 group-open:max-h-[500px] group-open:opacity-100 overflow-hidden transition-all duration-500 ease-in-out">
                                    <p className="font-semibold text-gray-700">Rincian Komponen:</p>
                                    <ul className="list-disc list-inside pl-4 max-h-60 overflow-y-auto text-xs space-y-1">
                                        {(() => {
                                            let componentsToRender = [];
                                            if (typeof item.components_snapshot === 'string') {
                                                try {
                                                    componentsToRender = JSON.parse(item.components_snapshot || '[]');
                                                } catch (e) {
                                                    console.error("Gagal mem-parse components_snapshot string:", item.components_snapshot, e);
                                                }
                                            } else if (Array.isArray(item.components_snapshot)) {
                                                componentsToRender = item.components_snapshot;
                                            } else if (item.components_snapshot) {
                                                console.warn("components_snapshot bukan string atau array, tapi truthy. Mencoba menggunakan apa adanya atau default ke array kosong. Nilai:", item.components_snapshot);
                                                componentsToRender = [];
                                            }
                                            if (!Array.isArray(componentsToRender)) componentsToRender = [];

                                            return componentsToRender.map((comp, idx) => (
                                                <li key={idx} className={`${parseFloat(comp.price_per_unit_snapshot || comp.pricePerUnit || 0) === 0 && (comp.component_type_snapshot || comp.component_type) !== 'info' ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                    {comp.component_name_snapshot || comp.name}: {parseFloat(comp.quantity_calculated || comp.quantity || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} {comp.unit_snapshot || comp.unit}
                                                    {' @ '} {formatCurrency(parseFloat(comp.price_per_unit_snapshot || comp.pricePerUnit || 0))}
                                                    {' = '} {formatCurrency(parseFloat(comp.cost_calculated || comp.cost || 0))}
                                                </li>
                                            ));
                                        })()}
                                    </ul>
                                    {(() => {
                                        let inputDetails = item.input_details_snapshot;
                                        if (typeof inputDetails === 'string') {
                                            try {
                                                inputDetails = JSON.parse(inputDetails);
                                            } catch (e) {
                                                console.error("Gagal mem-parse input_details_snapshot string:", item.input_details_snapshot, e);
                                                inputDetails = null;
                                            }
                                        }

                                        if (inputDetails?.type === 'schema' && inputDetails.parametersSnapshot && CALCULATION_SCHEMAS[inputDetails.schemaType]) {
                                            return (
                                                <div className="mt-2 pt-2 border-t border-gray-200/50">
                                                    <p className="font-semibold text-gray-700 text-xs">Parameter Input Digunakan:</p>
                                                    <ul className="list-disc list-inside pl-4 text-xs space-y-0.5 text-gray-600">
                                                        {CALCULATION_SCHEMAS[inputDetails.schemaType].inputs.map(inputDef => (
                                                            <li key={inputDef.key}>
                                                                {inputDef.label}: <strong className="text-gray-800">{inputDetails.parametersSnapshot[inputDef.key] !== undefined ? inputDetails.parametersSnapshot[inputDef.key] : 'N/A'}</strong> {inputDef.unitSymbol}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </details>
                        ))}
                    </div>
                ) : (
                    !currentProject.is_archived && !showWorkItemForm && (
                        <div className="text-center py-6">
                            <p className="text-gray-500 italic">Belum ada item pekerjaan ditambahkan ke proyek ini.</p>
                        </div>
                    )
                )
            )}
        </div>
    );
};

ProjectWorkItemsViewComponent.displayName = 'ProjectWorkItemsView';
const ProjectWorkItemsView = React.memo(ProjectWorkItemsViewComponent);
export default ProjectWorkItemsView;
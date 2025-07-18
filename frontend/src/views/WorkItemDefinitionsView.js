import React, { useMemo } from 'react';
import { ClipboardList, FilePlus, Info, Edit3, Trash2, PlusCircle, Save, XCircle, Sparkles, Loader2, Calculator, HelpCircle } from 'lucide-react';
import { CALCULATION_SCHEMAS, getCalculationSchemaTypes } from '../utils/calculationSchemas';

// --- Sub-komponen Tampilan Utama (Tidak berubah dari langkah sebelumnya) ---
const NoDataDisplay = ({ onNew }) => (
    <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
        <ClipboardList size={48} className="mx-auto text-industrial-gray" />
        <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Definisi Pekerjaan</h3>
        <p className="mt-2 text-industrial-gray-dark">Buat definisi pekerjaan untuk digunakan dalam proyek Anda.</p>
        <div className="mt-6">
            <button onClick={() => onNew(null)} className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors">
                <FilePlus size={18} className="mr-2"/> Buat Definisi Baru
            </button>
        </div>
    </div>
);
const DefinitionCard = ({ template, onEdit, onDelete }) => {
    const schemaInfo = template.calculation_schema_type ? CALCULATION_SCHEMAS[template.calculation_schema_type] : null;
    return (
        <div className="bg-white p-4 rounded-lg border border-industrial-gray-light hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-bold text-industrial-dark flex-grow break-words pr-2">{template.name}</h4>
                <div className="flex-shrink-0 space-x-1">
                    <button onClick={() => onEdit(template.id)} title="Edit" className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent transition-colors"><Edit3 size={16}/></button>
                    <button onClick={() => onDelete(template.id)} title="Hapus" className="p-1.5 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16}/></button>
                </div>
            </div>
            <div className="text-xs space-y-1">
                <p className="text-industrial-gray-dark"><span className="font-semibold">Skema:</span> {schemaInfo ? schemaInfo.name : 'Input Sederhana'}</p>
                <p className="text-industrial-gray-dark"><span className="font-semibold">Komponen:</span> {template.components?.length || 0}</p>
            </div>
        </div>
    );
};
const CategorySection = ({ categoryName, templates, onEdit, onDelete }) => (
    <div>
        <h3 className="text-lg font-semibold text-industrial-dark mb-3 pb-2 border-b-2 border-industrial-gray-light">{categoryName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.sort((a, b) => a.name.localeCompare(b.name)).map(template => <DefinitionCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
    </div>
);

// --- Sub-komponen Formulir (Tidak berubah dari langkah sebelumnya) ---
const FormField = ({ label, children }) => (<div><label className="block text-sm font-medium text-industrial-dark mb-1">{label}</label>{children}</div>);
const FormInput = (props) => (<input {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark placeholder-industrial-gray focus:outline-none focus:ring-2 focus:ring-industrial-accent" />);
const FormSelect = ({ children, ...props }) => (<select {...props} className="w-full p-2 bg-white border border-industrial-gray-light rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent">{children}</select>);
const FormActions = ({ onCancel, onSave, isSaving }) => (
    <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-industrial-gray-light">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-industrial-dark rounded-md">Batal</button>
        <button type="button" onClick={onSave} disabled={isSaving} className="px-6 py-2 bg-industrial-accent hover:bg-industrial-accent-dark text-white font-semibold rounded-md flex items-center disabled:opacity-50 shadow-sm">
            <Save size={18} className="mr-2"/>{isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
    </div>
);

// --- Komponen Utama ---
const WorkItemDefinitionsView = ({
    userWorkItemTemplates, userWorkItemCategories, materialPrices,
    showTemplateForm, setShowTemplateForm, editingTemplateData, setEditingTemplateData,
    selectedTemplateKeyForEditing, setSelectedTemplateKeyForEditing,
    handleOpenTemplateForm, handleTemplateFormChange, handleTemplateComponentChange,
    handleAddTemplateComponent, handleRemoveTemplateComponent, handleSaveWorkItemTemplate,
    isSavingDefinition, handleDeleteWorkItemDefinition, handleSuggestComponents,
    isSuggestingComponents, isLoading,
}) => {
    const { templatesArray, templatesByCategory, sortedMaterialPrices, groupedSchemas } = useMemo(() => {
        const templatesArr = Object.values(userWorkItemTemplates || {});
        const templatesByCat = templatesArr.reduce((acc, template) => {
            const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
            const categoryName = categoryObj ? categoryObj.category_name : 'Tidak Terkategori';
            if (!acc[categoryName]) acc[categoryName] = [];
            acc[categoryName].push(template);
            return acc;
        }, {});
        const sortedPrices = [...(materialPrices || [])].sort((a, b) => a.name.localeCompare(b.name));
        const availableSchemas = getCalculationSchemaTypes();
        const schemasByGroup = availableSchemas.reduce((acc, schema) => {
            const group = schema.group || 'Lainnya';
            if (!acc[group]) acc[group] = [];
            acc[group].push(schema);
            return acc;
        }, {});

        return { templatesArray: templatesArr, templatesByCategory: templatesByCat, sortedMaterialPrices: sortedPrices, groupedSchemas: schemasByGroup };
    }, [userWorkItemTemplates, userWorkItemCategories, materialPrices]);


    // --- Tampilan Formulir ---
    if (showTemplateForm && editingTemplateData) {
        const currentSchemaKey = editingTemplateData.calculation_schema_type || 'SIMPLE_PRIMARY_INPUT';
        const currentSelectedSchemaDetails = CALCULATION_SCHEMAS[currentSchemaKey];

        return (
            <div className="p-6 bg-white border border-industrial-gray-light rounded-lg shadow-lg animate-fadeIn max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-industrial-accent mb-6 pb-4 border-b border-industrial-gray-light">
                    {selectedTemplateKeyForEditing ? 'Edit Definisi Pekerjaan' : 'Buat Definisi Pekerjaan Baru'}
                </h2>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Nama Pekerjaan"><FormInput type="text" value={editingTemplateData.name || ''} onChange={(e) => handleTemplateFormChange('name', e.target.value)} placeholder="e.g., Pekerjaan Dinding Batako" /></FormField>
                        <FormField label="Kategori">
                            <FormSelect name="category_id" value={editingTemplateData.category_id || ''} onChange={(e) => handleTemplateFormChange('category_id', e.target.value)}>
                                <option value="">-- Pilih Kategori --</option>
                                {userWorkItemCategories.sort((a, b) => a.category_name.localeCompare(b.category_name)).map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
                            </FormSelect>
                        </FormField>
                    </div>

                    <fieldset className="border border-industrial-gray-light p-4 rounded-md">
                        <legend className="text-md font-semibold text-industrial-accent px-2 flex items-center"><Calculator size={18} className="mr-2" /> Metode Kalkulasi</legend>
                        <div className="mt-2">
                            <FormField label="Pilih Jenis Kalkulasi">
                                <FormSelect name="calculation_schema_type" value={currentSchemaKey} onChange={(e) => handleTemplateFormChange('calculation_schema_type', e.target.value)}>
                                    {Object.entries(groupedSchemas).map(([groupName, schemasInGroup]) => (
                                        <optgroup key={groupName} label={groupName}>{schemasInGroup.map(schemaType => (<option key={schemaType.id} value={schemaType.id}>{schemaType.name}</option>))}</optgroup>
                                    ))}
                                </FormSelect>
                            </FormField>
                            {currentSelectedSchemaDetails?.description && (
                                <p className="mt-2 text-xs text-industrial-gray-dark flex items-start"><HelpCircle size={16} className="mr-1.5 flex-shrink-0 mt-0.5 text-industrial-accent" />{currentSelectedSchemaDetails.description}</p>
                            )}
                        </div>
                    </fieldset>

                    <div>
                        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                            <h3 className="text-lg font-semibold text-industrial-dark">Komponen (Material & Upah)</h3>
                            <button onClick={handleSuggestComponents} disabled={!editingTemplateData.name?.trim() || isSuggestingComponents} className="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center disabled:opacity-60 shadow-sm">
                                {isSuggestingComponents ? <Loader2 size={16} className="mr-1.5 animate-spin"/> : <Sparkles size={16} className="mr-1.5"/>}
                                {isSuggestingComponents ? 'Menyarankan...' : 'Saran AI'}
                            </button>
                        </div>
                        <div className="space-y-3 p-3 bg-gray-50 border border-industrial-gray-light rounded-md max-h-[40vh] overflow-y-auto">
                            {(editingTemplateData.components || []).map((comp, index) => (
                                <div key={comp.tempId || index} className="p-3 bg-white rounded-md border border-industrial-gray-light grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-2 items-end relative">
                                    <button onClick={() => handleRemoveTemplateComponent(index)} className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600" title="Hapus Komponen"><XCircle size={16}/></button>
                                    <div className="lg:col-span-2"><FormField label="Sumber Daya"><FormSelect value={comp.selectedResourceId || ''} onChange={(e) => handleTemplateComponentChange(index, 'selectedResourceId', e.target.value)}><option value="">-- Pilih --</option>{sortedMaterialPrices.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.unit})</option>))}</FormSelect></FormField></div>
                                    <div><FormField label="Nama Tampilan"><FormInput type="text" value={comp.display_name || ''} onChange={(e) => handleTemplateComponentChange(index, 'display_name', e.target.value)} placeholder="Nama" /></FormField></div>
                                    <div><FormField label="Koefisien"><FormInput type="number" step="0.0001" value={comp.coefficient || 0} onChange={(e) => handleTemplateComponentChange(index, 'coefficient', e.target.value)} /></FormField></div>
                                    <div><FormField label="Tipe"><FormSelect value={comp.component_type || 'material'} onChange={(e) => handleTemplateComponentChange(index, 'component_type', e.target.value)}><option value="material">Material</option><option value="labor">Upah</option><option value="info">Info</option></FormSelect></FormField></div>
                                </div>
                            ))}
                             <button onClick={handleAddTemplateComponent} className="w-full mt-2 px-3 py-2 text-sm border-2 border-dashed border-industrial-gray-light hover:border-industrial-accent text-industrial-accent rounded-md flex items-center justify-center transition-all">
                                <PlusCircle size={16} className="mr-2"/> Tambah Komponen
                            </button>
                        </div>
                    </div>
                </div>
                <FormActions onCancel={() => { setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null); }} onSave={handleSaveWorkItemTemplate} isSaving={isSavingDefinition}/>
            </div>
        );
    }
    
    // --- Tampilan Utama (Daftar) ---
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-industrial-dark">Definisi Item Pekerjaan</h1>
                <button
                    onClick={() => handleOpenTemplateForm(null)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <FilePlus size={18} className="mr-2"/> Tambah Pekerjaan Baru
                </button>
            </div>
            
            {isLoading && templatesArray.length === 0 && <p className="text-center text-industrial-gray">Memuat definisi...</p>}
            {!isLoading && templatesArray.length === 0 ? <NoDataDisplay onNew={handleOpenTemplateForm} /> : (
                Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoryName, templates]) => (
                    <CategorySection key={categoryName} categoryName={categoryName} templates={templates} onEdit={handleOpenTemplateForm} onDelete={handleDeleteWorkItemDefinition}/>
                ))
            )}
        </div>
    );
};

export default WorkItemDefinitionsView;
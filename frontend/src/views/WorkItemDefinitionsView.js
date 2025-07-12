import React, { useMemo } from 'react'; // Import useMemo
import {
    ClipboardList, FilePlus, Settings, Info, Edit3, Trash2, PlusCircle, Save, XCircle, Sparkles, Loader2, Calculator, HelpCircle
} from 'lucide-react';
import { DEFAULT_PRIMARY_INPUT_LABELS } from '../utils/constants';
import { CALCULATION_SCHEMAS, getCalculationSchemaTypes } from '../utils/calculationSchemas';

const WorkItemDefinitionsViewComponent = ({
    userWorkItemTemplates,
    userWorkItemCategories,
    materialPrices,
    showTemplateForm,
    setShowTemplateForm,
    editingTemplateData,
    setEditingTemplateData,
    selectedTemplateKeyForEditing,
    setSelectedTemplateKeyForEditing,
    handleOpenTemplateForm,
    handleTemplateFormChange,
    handleTemplateComponentChange,
    handleAddTemplateComponent,
    handleRemoveTemplateComponent,
    handleSaveWorkItemTemplate,
    isSavingDefinition,
    handleDeleteWorkItemDefinition,
    handleSuggestComponents,
    isSuggestingComponents,
    isLoading,
    setShowManageCategoriesModal,
    userUnits,
}) => {
    console.log("Props diterima oleh WorkItemDefinitionsView:", {
        userWorkItemTemplates,
        userWorkItemCategories,
        materialPrices
    });
    if (!userWorkItemTemplates || !userWorkItemCategories || !materialPrices) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-500">
                <Loader2 className="animate-spin mr-2" />
                <span>Mempersiapkan data definisi...</span>
            </div>
        );
    }
    const templatesArray = Object.values(userWorkItemTemplates);
    const templatesByCategory = templatesArray.reduce((acc, template) => {
        const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
        const categoryName = categoryObj ? categoryObj.category_name : 'Tidak Ada Kategori';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(template);
        return acc;
    }, {});
    const sortedMaterialPrices = [...materialPrices].sort((a, b) => a.name.localeCompare(b.name));
    const availableCalculationSchemas = getCalculationSchemaTypes();
    const groupedSchemas = useMemo(() => {
        return availableCalculationSchemas.reduce((acc, schema) => {
            const group = schema.group || 'Lainnya'; // Fallback untuk yang tidak punya grup
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(schema);
            return acc;
        }, {});
    }, [availableCalculationSchemas]);

    if (showTemplateForm && editingTemplateData) {
        const currentSchemaKey = editingTemplateData.calculation_schema_type || 'SIMPLE_PRIMARY_INPUT';
        const currentSelectedSchemaDetails = CALCULATION_SCHEMAS[currentSchemaKey];
        const isCurrentSchemaSimple = !currentSelectedSchemaDetails || currentSelectedSchemaDetails.isSimple;

        return (
            <div className="p-4 md:p-6 bg-white border border-gray-200 rounded-lg shadow-xl animate-fadeIn">
                <h2 className="text-2xl font-semibold text-sky-600 mb-6">
                    {selectedTemplateKeyForEditing ? `Edit Definisi: ${editingTemplateData.name || '...'}` : 'Buat Komponen Pekerjaan Baru'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="templateNameDef" className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
                        <input
                            type="text"
                            id="templateNameDef"
                            value={editingTemplateData.name || ''}
                            onChange={(e) => handleTemplateFormChange('name', e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="e.g., Pekerjaan Dinding Batako"
                        />
                    </div>
                    <div>
                        <label htmlFor="templateCategoryDef" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            id="templateCategoryDef"
                            name="category_id"
                            value={editingTemplateData.category_id || ''}
                            onChange={(e) => handleTemplateFormChange('category_id', e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {userWorkItemCategories.sort((a, b) => a.category_name.localeCompare(b.category_name)).map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
                        </select>
                    </div>
                </div>

                <fieldset className="mb-6 border border-gray-300 p-4 rounded-md">
                    <legend className="text-md font-medium text-sky-600 px-2 flex items-center">
                        <Calculator size={18} className="mr-2" /> Metode Kalkulasi
                    </legend>
                    <div className="mt-2">
                        <label htmlFor="calculationSchemaTypeDef" className="block text-sm font-medium text-gray-700 mb-1">Pilih Jenis Kalkulasi</label>
                        <select
                            id="calculationSchemaTypeDef"
                            name="calculation_schema_type"
                            value={currentSchemaKey}
                            onChange={(e) => handleTemplateFormChange('calculation_schema_type', e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">-- Pilih Metode Kalkulasi --</option>
                            {Object.entries(groupedSchemas).map(([groupName, schemasInGroup]) => (
                                <optgroup key={groupName} label={groupName}>
                                    {schemasInGroup.map(schemaType => (
                                        <option key={schemaType.id} value={schemaType.id}>{schemaType.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {currentSelectedSchemaDetails && currentSelectedSchemaDetails.description && (
                            <p className="mt-2 text-xs text-gray-600 flex items-start">
                                <HelpCircle size={16} className="mr-1.5 flex-shrink-0 mt-0.5 text-sky-500" />
                                {currentSelectedSchemaDetails.description}
                            </p>
                        )}
                    </div>
                </fieldset>

                {isCurrentSchemaSimple ? (
                    null
                ) : (
                    currentSelectedSchemaDetails && (
                        <fieldset className="mb-6 border border-gray-300 p-4 rounded-md">
                            <legend className="text-sm font-medium text-sky-600 px-2">Detail Skema: {currentSelectedSchemaDetails.name}</legend>
                            <div className="mt-2 space-y-3 text-xs text-gray-600">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-0.5">Parameter Input yang Dibutuhkan Skema:</h4>
                                    {currentSelectedSchemaDetails.inputs.length > 0 ? (
                                        <ul className="list-disc list-inside pl-2 space-y-0.5">
                                            {currentSelectedSchemaDetails.inputs.map(input => (
                                                <li key={input.key}>
                                                    {input.label} ({input.key}) - Unit: {input.unitSymbol}
                                                    {input.defaultValue !== undefined && ` (Default di form: ${input.defaultValue})`}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="italic text-gray-500">Tidak ada parameter input spesifik yang ditentukan oleh skema ini.</p>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-0.5">Output dari Kalkulasi:</h4>
                                    <p className="pl-2">
                                        {currentSelectedSchemaDetails.output.label} - Unit: {currentSelectedSchemaDetails.output.unitSymbol}
                                    </p>
                                </div>
                            </div>
                        </fieldset>
                    )
                )}

                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                    <h3 className="text-lg font-semibold text-sky-700">Komponen (Material & Tenaga Kerja)</h3>
                    <p className="text-xs text-gray-500 mr-auto ml-3 md:ml-1 order-last md:order-none w-full md:w-auto">
                        (Koefisien berlaku untuk output kalkulasi skema)
                    </p>
                    <button
                        onClick={handleSuggestComponents}
                        disabled={!editingTemplateData.name?.trim() || isSuggestingComponents}
                        className="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center disabled:opacity-60 shadow-sm"
                    >
                        {isSuggestingComponents ? <Loader2 size={16} className="mr-1.5 animate-spin"/> : <Sparkles size={16} className="mr-1.5"/>}
                        {isSuggestingComponents ? 'Menyarankan...' : '✨ Sarankan Komponen'}
                    </button>
                </div>
                <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                    {(editingTemplateData.components || []).map((comp, index) => (
                        <div key={comp.tempId || index} className="p-3 bg-gray-50 rounded-md border border-gray-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-2 items-end relative">
                            <button onClick={() => handleRemoveTemplateComponent(index)} className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-600" title="Hapus Komponen">
                                <XCircle size={16}/>
                            </button>
                            <div className="lg:col-span-2">
                                <label className="block text-xs text-gray-500 mb-0.5">Pilih Sumber Daya dari Daftar Harga</label>
                                <select
                                    value={comp.selectedResourceId || ''}
                                    onChange={(e) => handleTemplateComponentChange(index, 'selectedResourceId', e.target.value)}
                                    className="w-full p-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">-- Pilih Sumber Daya --</option>
                                    {sortedMaterialPrices.map(priceItem => (<option key={priceItem.id} value={priceItem.id}>{priceItem.name} ({priceItem.unit})</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Nama Tampilan Komponen</label>
                                <input
                                    type="text"
                                    value={comp.display_name || ''}
                                    onChange={(e) => handleTemplateComponentChange(index, 'display_name', e.target.value)}
                                    placeholder="Nama Tampilan"
                                    className="w-full p-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-sky-500 focus:border-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Koefisien</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={comp.coefficient || 0}
                                    onChange={(e) => handleTemplateComponentChange(index, 'coefficient', e.target.value)}
                                    className="w-full p-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-sky-500 focus:border-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Jenis</label>
                                <select
                                    value={comp.component_type || 'material'}
                                    onChange={(e) => handleTemplateComponentChange(index, 'component_type', e.target.value)}
                                    className="w-full p-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="material">Material</option>
                                    <option value="labor">Tenaga Kerja</option>
                                    <option value="material_service">Material + Jasa</option>
                                    <option value="info">Informasi (Tanpa Biaya)</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddTemplateComponent} className="mb-6 px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-md flex items-center shadow-sm">
                    <PlusCircle size={16} className="mr-1.5"/> Tambah Komponen
                </button>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-300">
                    <button
                        type="button"
                        onClick={() => { setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null); }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveWorkItemTemplate}
                        disabled={isSavingDefinition}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center disabled:opacity-50 shadow-sm"
                    >
                        <Save size={18} className="mr-2"/> {isSavingDefinition ? 'Menyimpan...' : 'Simpan Definisi'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-3xl font-semibold text-sky-600 flex items-center">
                    <ClipboardList size={30} className="mr-3"/>Komponen Pekerjaan
                </h2>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowManageCategoriesModal(true)}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105"
                    >
                        <Settings size={20} className="mr-2"/> Kelola Kategori
                    </button>
                    <button
                        onClick={() => handleOpenTemplateForm(null)}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105"
                    >
                        <FilePlus size={20} className="mr-2"/> Tambah Pekerjaan Baru
                    </button>
                </div>
            </div>
            {isLoading && templatesArray.length === 0 && (
                 <div className="text-center p-4 text-gray-500">Memuat definisi...</div>
            )}
            {!isLoading && templatesArray.length === 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                    <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                    Belum ada item pekerjaan. Tambahkan beberapa untuk memulai!
                </div>
            )}

            {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoryName, templates]) => (
                <div key={categoryName} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-sky-700 mb-3 border-b border-gray-300 pb-2">{categoryName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.sort((a, b) => a.name.localeCompare(b.name)).map(template => {
                            const schemaInfo = template.calculation_schema_type ? CALCULATION_SCHEMAS[template.calculation_schema_type] : null;
                            return (
                                <div key={template.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-medium text-gray-800 flex-grow break-words">{template.name}</h4>
                                        <div className="flex-shrink-0 space-x-1 ml-2">
                                            <button onClick={() => handleOpenTemplateForm(template.id)} title="Edit Definisi" className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors">
                                                <Edit3 size={16}/>
                                            </button>
                                            <button onClick={() => handleDeleteWorkItemDefinition(template.id)} title="Hapus Definisi" className="p-1 text-red-600 hover:text-red-700 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                    {schemaInfo && !schemaInfo.isSimple ? (
                                        <p className="text-xs text-sky-600 mt-1">Jenis: {schemaInfo.name}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">Jenis: Input Sederhana</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Komponen: {template.components?.length || 0}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const WorkItemDefinitionsView = (props) => {
    // Anda bisa melakukan destructuring dari manager di sini jika ada,
    // atau langsung pass semua props ke bawah.
    // Contoh jika Anda menggunakan 'definitionsManager':
    // const { definitionsManager, ...otherProps } = props;
    // return <WorkItemDefinitionsViewComponent {...definitionsManager} {...otherProps} />
    
    // Untuk saat ini, kita anggap props sudah benar dari parent.
    return <WorkItemDefinitionsViewComponent {...props} />;
};

export default WorkItemDefinitionsView;
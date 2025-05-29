// components/WorkItemDefinitionsView.js
import React from 'react';
import {
  ClipboardList, FilePlus, Settings, Info, Edit3, Trash2, PlusCircle, Save, XCircle, Sparkles, Loader2
} from 'lucide-react';
import { DEFAULT_PRIMARY_INPUT_LABELS } from '../utils/constants'; // Assuming constants are in utils

const WorkItemDefinitionsView = ({
  userWorkItemTemplates,
  userWorkItemCategories,
  materialPrices, // For component resource selection
  showTemplateForm,
  setShowTemplateForm,
  editingTemplateData,
  setEditingTemplateData,
  selectedTemplateKeyForEditing,
  setSelectedTemplateKeyForEditing, // To reset
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
  isLoading, // Loading state for definitions
  setShowManageCategoriesModal, // To open the categories management modal
  userUnits, // For primary input unit selection
}) => {
  const templatesArray = Object.values(userWorkItemTemplates);
  const templatesByCategory = templatesArray.reduce((acc, template) => {
    const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
    const categoryName = categoryObj ? categoryObj.category_name : 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(template);
    return acc;
  }, {});
  const sortedMaterialPrices = [...materialPrices].sort((a, b) => a.name.localeCompare(b.name));

  if (showTemplateForm && editingTemplateData) {
    return (
      <div className="p-4 md:p-6 bg-slate-800 rounded-lg shadow-xl animate-fadeIn">
        <h2 className="text-2xl font-semibold text-sky-400 mb-6">
          {selectedTemplateKeyForEditing ? `Edit: ${editingTemplateData.name}` : 'Create New Work Item Definition'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-slate-300 mb-1">Template Name</label>
            <input
              type="text"
              id="templateName"
              value={editingTemplateData.name}
              onChange={(e) => handleTemplateFormChange('name', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              placeholder="e.g., Pekerjaan Dinding Batako"
            />
          </div>
          <div>
            <label htmlFor="templateCategory" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              id="templateCategory"
              name="category_id"
              value={editingTemplateData.category_id}
              onChange={(e) => handleTemplateFormChange('category_id', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              {userWorkItemCategories.sort((a,b) => a.category_name.localeCompare(b.category_name)).map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
            </select>
          </div>
        </div>

        <fieldset className="mb-6 border border-slate-600 p-4 rounded-md">
          <legend className="text-sm font-medium text-sky-400 px-2">Primary Input</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label htmlFor="primaryInputNature" className="block text-xs text-slate-400 mb-1">Input Nature</label>
              <select
                id="primaryInputNature"
                name="primary_input_nature"
                value={editingTemplateData.primary_input_nature || 'volume'}
                onChange={(e) => handleTemplateFormChange('primary_input_nature', e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                <option value="volume">Volume Based</option>
                <option value="area">Area Based</option>
                <option value="area_datar">Luas Datar Based</option>
                <option value="item">Item/Count Based</option>
              </select>
            </div>
            <div>
              <label htmlFor="primaryInputLabel" className="block text-xs text-slate-400 mb-1">Display Label</label>
              <select
                id="primaryInputLabel"
                name="primary_input_label"
                value={editingTemplateData.primary_input_label}
                onChange={(e) => handleTemplateFormChange('primary_input_label', e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                {DEFAULT_PRIMARY_INPUT_LABELS.map(lbl => <option key={lbl} value={lbl}>{lbl}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="primaryInputUnit" className="block text-xs text-slate-400 mb-1">Display Unit</label>
              <select
                id="primaryInputUnit"
                name="primary_input_unit_id"
                value={editingTemplateData.primary_input_unit_id}
                onChange={(e) => handleTemplateFormChange('primary_input_unit_id', e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                {userUnits.sort((a,b) => a.unit_name.localeCompare(b.unit_name)).map(unt => <option key={unt.id} value={unt.id}>{unt.unit_name}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-sky-300">Components (Materials & Labor)</h3>
          <button
            onClick={handleSuggestComponents}
            disabled={!editingTemplateData.name?.trim() || isSuggestingComponents}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center disabled:opacity-60"
          >
            {isSuggestingComponents ? <Loader2 size={16} className="mr-1.5 animate-spin"/> : <Sparkles size={16} className="mr-1.5"/>}
            {isSuggestingComponents ? 'Suggesting...' : '✨ Suggest Components'}
          </button>
        </div>

        <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-2">
          {(editingTemplateData.components || []).map((comp, index) => (
            <div key={comp.tempId} className="p-3 bg-slate-700/70 rounded-md border border-slate-600 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-2 items-end relative">
              <button onClick={() => handleRemoveTemplateComponent(index)} className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-400" title="Remove Component">
                <XCircle size={16}/>
              </button>
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-400 mb-0.5">Select Resource from Price List</label>
                <select
                  value={comp.selectedResourceId || ''}
                  onChange={(e) => handleTemplateComponentChange(index, 'selectedResourceId', e.target.value)}
                  className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"
                >
                  <option value="">-- Select Resource --</option>
                  {sortedMaterialPrices.map(priceItem => (<option key={priceItem.id} value={priceItem.id}>{priceItem.name} ({priceItem.unit})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Component Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={comp.display_name}
                  onChange={(e) => handleTemplateComponentChange(index, 'display_name', e.target.value)}
                  placeholder="Display Name"
                  className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Coefficient</label>
                <input
                  type="number"
                  step="0.0001"
                  name="coefficient"
                  value={comp.coefficient}
                  onChange={(e) => handleTemplateComponentChange(index, 'coefficient', e.target.value)}
                  className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Type</label>
                <select
                  name="component_type"
                  value={comp.component_type}
                  onChange={(e) => handleTemplateComponentChange(index, 'component_type', e.target.value)}
                  className="w-full p-1.5 bg-slate-600 border border-slate-500 rounded-md text-white text-sm"
                >
                  <option value="material">Material</option>
                  <option value="labor">Labor</option>
                  <option value="material_service">Material + Service</option>
                  <option value="info">Informational (No Cost)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleAddTemplateComponent} className="mb-6 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-md flex items-center">
          <PlusCircle size={16} className="mr-1.5"/> Add Component
        </button>
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={() => { setShowTemplateForm(false); setEditingTemplateData(null); setSelectedTemplateKeyForEditing(null); }}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveWorkItemTemplate}
            disabled={isSavingDefinition}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center disabled:opacity-50"
          >
            <Save size={18} className="mr-2"/> {isSavingDefinition ? 'Saving...' : 'Save Definition'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-sky-400 flex items-center">
          <ClipboardList size={30} className="mr-3"/>Work Item Definitions
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowManageCategoriesModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Settings size={20} className="mr-2"/> Manage Categories
          </button>
          <button
            onClick={() => handleOpenTemplateForm(null)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-md flex items-center transition-transform hover:scale-105"
          >
            <FilePlus size={20} className="mr-2"/> Create New Definition
          </button>
        </div>
      </div>

      {isLoading && templatesArray.length === 0 && (
        <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-400">Loading definitions...</div>
      )}
      {!isLoading && templatesArray.length === 0 && (
        <div className="p-6 bg-slate-700 rounded-lg text-center text-slate-300">
          <Info size={24} className="mx-auto mb-2 text-sky-500"/>
          No work item definitions found. Click "Create New Definition" to get started.
        </div>
      )}

      {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoryName, templates]) => (
        <div key={categoryName} className="bg-slate-700/50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-sky-300 mb-3 border-b border-slate-600 pb-2">{categoryName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.sort((a,b) => a.name.localeCompare(b.name)).map(template => (
              <div key={template.id} className="bg-slate-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-medium text-white flex-grow break-words">{template.name}</h4>
                  <div className="flex-shrink-0 space-x-1 ml-2">
                    <button onClick={() => handleOpenTemplateForm(template.id)} title="Edit Definition" className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <Edit3 size={16}/>
                    </button>
                    <button onClick={() => handleDeleteWorkItemDefinition(template.id)} title="Delete Definition" className="p-1 text-red-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-1">Key: <span className="font-mono">{template.definition_key}</span></p>
                <p className="text-xs text-slate-500 mt-1">Components: {template.components?.length || 0}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkItemDefinitionsView;

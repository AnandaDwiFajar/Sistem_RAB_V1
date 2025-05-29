// components/ProjectWorkItemsView.js (New File)
import React from 'react'; // Or remove if using new JSX transform and no other React.* calls
import { PlusCircle, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ProjectWorkItemsView = React.memo(({
    currentProject, // Only pass what's needed
    showWorkItemForm,
    setShowWorkItemForm,
    workItemFormData,
    handleWorkItemFormChange,
    userWorkItemTemplates,
    userWorkItemCategories,
    // materialPrices, // Only if needed directly here, or passed down from App.js calculation
    calculatedWorkItemPreview,
    setCalculatedWorkItemPreview,
    handleAddWorkItemToProject,
    isAddingWorkItem,
    handleDeleteWorkItem
}) => {
    if (!currentProject) return null;

    const templatesArray = Object.values(userWorkItemTemplates);
    const templatesByCategory = templatesArray.reduce((acc, template) => {
        const categoryObj = userWorkItemCategories.find(c => c.id === template.category_id);
        const categoryName = categoryObj ? categoryObj.category_name : 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(template);
        return acc;
    }, {});

    // The entire JSX from your original RenderCurrentProjectWorkItemsView goes here
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h4 className="text-xl font-medium text-white">Work Items in Project:</h4>
                <button
                    onClick={() => {
                        setShowWorkItemForm(!showWorkItemForm);
                        setCalculatedWorkItemPreview(null);
                        // Reset form fields through the handler
                        handleWorkItemFormChange({ target: { name: 'templateKey', value: '' } });
                        handleWorkItemFormChange({ target: { name: 'primaryInputValue', value: '' } });
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md shadow-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105">
                    <PlusCircle size={20} className="mr-2"/> {showWorkItemForm ? 'Cancel Adding Item' : 'Add Work Item'}
                </button>
            </div>

            {showWorkItemForm && (
                <div className="p-6 bg-slate-700 rounded-lg shadow-lg space-y-4 animate-fadeIn">
                    <h4 className="text-xl font-medium text-white">Add New Work Item</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select name="templateKey" value={workItemFormData.templateKey} onChange={handleWorkItemFormChange} className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none">
                            <option value="">-- Select Work Item Type --</option>
                            {templatesArray.length === 0 && <option disabled>No definitions loaded</option>}
                            {Object.entries(templatesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoryName, templates]) => (
                                <optgroup label={categoryName} key={categoryName} className="bg-slate-800 text-sky-300 font-semibold">
                                    {templates.sort((a, b) => a.name.localeCompare(b.name)).map(template => (
                                        <option key={template.id} value={template.id} className="text-white bg-slate-800">{template.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {workItemFormData.templateKey && userWorkItemTemplates[workItemFormData.templateKey] && (
                            <input // THIS IS THE WORK ITEM VOLUME INPUT
                                type="number"
                                name="primaryInputValue"
                                value={workItemFormData.primaryInputValue}
                                onChange={handleWorkItemFormChange}
                                placeholder={`Volume`}
                                min="0.01" step="0.01"
                                className="p-3 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none"
                            />
                        )}
                    </div>
                    {/* ... rest of the work item form ... */}
                     {calculatedWorkItemPreview && (
                        <div className="mt-4 p-4 bg-slate-800/70 rounded-md space-y-3 border border-slate-600">
                            <h5 className="text-lg font-semibold tex    t-sky-300">Calculation Preview: {calculatedWorkItemPreview.name}</h5>
                            <p className="text-sm text-slate-400">Input: {calculatedWorkItemPreview.primaryInputDisplay}</p>
                            <ul className="text-xs list-disc list-inside pl-2 text-slate-300 max-h-40 overflow-y-auto">
                                {calculatedWorkItemPreview.components.map((comp, idx) => (
                                <li key={idx} className={`${comp.pricePerUnit === 0 && comp.component_type !== 'info' ? 'text-yellow-400' : ''}`}>
                                    {comp.name}: {comp.quantity.toFixed(3)} {comp.unit} @ {formatCurrency(comp.pricePerUnit)} = {formatCurrency(comp.cost)}
                                    {comp.pricePerUnit === 0 && comp.component_type !== 'info' && <span className="ml-1 text-yellow-500">(Price not found or zero!)</span>}</li>))}</ul>
                            <p className="text-md font-semibold text-green-400">Total Item Cost: {formatCurrency(calculatedWorkItemPreview.totalItemCost)}</p></div>)}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => { setShowWorkItemForm(false); setCalculatedWorkItemPreview(null); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">Cancel</button>
                        <button onClick={handleAddWorkItemToProject} disabled={!calculatedWorkItemPreview || isAddingWorkItem} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center transition-colors disabled:opacity-50">
                            <Save size={18} className="mr-2"/> {isAddingWorkItem ? 'Adding...' : 'Add Item to Project'}
                        </button>
                    </div>
                </div>
            )}
            {/* ... list of existing work items ... */}
             {(currentProject.workItems || []).length > 0 ? (
                <div className="space-y-4">{(currentProject.workItems || []).sort((a,b) => new Date(b.added_at || 0) - new Date(a.added_at || 0)).map(item => (
                    <details key={item.id} className="bg-slate-800 p-4 rounded-lg shadow-md group">
                        <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-sky-400 group-hover:text-sky-300">
                            <span>{item.definition_name_snapshot} <span className="text-sm text-slate-400">({item.primary_input_display_snapshot})</span></span>
                            <div className="flex items-center"> <span className="text-green-400 mr-4">{formatCurrency(parseFloat(item.total_item_cost_snapshot))}</span>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteWorkItem(item.id); }} className="p-1 text-red-500 hover:text-red-400 opacity-70 hover:opacity-100 transition-colors mr-2" title="Delete Work Item"><Trash2 size={18}/></button>
                                <ChevronDown size={24} className="group-open:hidden transition-transform"/><ChevronUp size={24} className="hidden group-open:block transition-transform"/></div></summary>
                        <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-300 space-y-1"><p className="font-semibold text-slate-200">Components:</p>
                            <ul className="list-disc list-inside pl-4 max-h-60 overflow-y-auto">{(item.components_snapshot || []).map((comp, idx) => (
                                <li key={idx} className={`${parseFloat(comp.price_per_unit_snapshot) === 0 && comp.component_type_snapshot !== 'info' ? 'text-yellow-400' : ''}`}>
                                    {comp.component_name_snapshot}: {parseFloat(comp.quantity_calculated).toFixed(3)} {comp.unit_snapshot} @ {formatCurrency(parseFloat(comp.price_per_unit_snapshot))} = {formatCurrency(parseFloat(comp.cost_calculated))}
                                </li>))}</ul></div></details>))}</div>
            ) : ( <p className="text-slate-400 text-center py-4">No work items added to this project yet.</p> )}
        </div>
    );
});
export default ProjectWorkItemsView;
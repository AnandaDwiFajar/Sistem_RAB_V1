// src/services/apiService.js
// Ensure this matches your backend server's address and port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// --- Helper for requests ---
const request = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // For DELETE or other methods that might not return JSON body consistently
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return { message: 'Operation successful (no content)' };
    }
    return response.json();
};

// --- User Meta Data (Units, Categories) ---
// userId is expected to be passed to these functions from your app's auth state

// Units
export const fetchUserUnits = (userId) => request(`${API_BASE_URL}/units/user/${userId}`);
export const addUnitApi = (userId, unitName) => request(`${API_BASE_URL}/units/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit_name: unitName }),
});
export const deleteUnitApi = (userId, unitId) => request(`${API_BASE_URL}/units/${unitId}?userId=${userId}`, { // Pass userId as query for this example
    method: 'DELETE',
});

// Work Item Categories
export const fetchWorkItemCategories = (userId) => request(`${API_BASE_URL}/work-item-categories/user/${userId}`);
export const addWorkItemCategoryApi = (userId, categoryName) => request(`${API_BASE_URL}/work-item-categories/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_name: categoryName }),
});
export const deleteWorkItemCategoryApi = (userId, categoryId) => request(`${API_BASE_URL}/work-item-categories/${categoryId}?userId=${userId}`, {
    method: 'DELETE',
});

// Cash Flow Categories
export const fetchCashFlowCategories = (userId) => request(`${API_BASE_URL}/cash-flow-categories/user/${userId}`);
export const addCashFlowCategoryApi = (userId, categoryName) => request(`${API_BASE_URL}/cash-flow-categories/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_name: categoryName }),
});
export const deleteCashFlowCategoryApi = (userId, categoryId) => request(`${API_BASE_URL}/cash-flow-categories/${categoryId}?userId=${userId}`, {
    method: 'DELETE',
});


// --- Material Prices ---
export const fetchMaterialPrices = (userId) => request(`${API_BASE_URL}/material-prices/user/${userId}`);
export const addMaterialPriceApi = (userId, priceData) => request(`${API_BASE_URL}/material-prices/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // priceData should be { item_name, unit_id, price }
    body: JSON.stringify({ ...priceData, userId }), // userId in body if controller expects it there
});
export const updateMaterialPriceApi = (priceId, priceData, userId) => request(`${API_BASE_URL}/material-prices/${priceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    // priceData should be { item_name, unit_id, price }
    body: JSON.stringify({ ...priceData, userId }), // userId in body if controller expects it there
});
export const deleteMaterialPriceApi = (priceId, userId) => request(`${API_BASE_URL}/material-prices/${priceId}?userId=${userId}`, {
    method: 'DELETE',
});

// --- Work Item Definitions (Templates) ---
// Placeholder - implement similarly
export const fetchWorkItemDefinitions = (userId) => request(`${API_BASE_URL}/work-item-definitions/user/${userId}`);
// ... add, update, delete for definitions (these will be more complex due to components)

// --- Projects ---
// Placeholder - implement similarly
export const fetchProjects = (userId) => request(`${API_BASE_URL}/projects/user/${userId}`);
export const createProjectApi = (userId, projectData) => request(`${API_BASE_URL}/projects/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData), // { projectName }
});
// ... update, delete, get single project, add work item to project, etc.
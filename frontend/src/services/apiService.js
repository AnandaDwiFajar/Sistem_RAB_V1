// src/services/apiService.js
import { getAuth } from 'firebase/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

/**
 * Helper utama untuk semua request API.
 * Menangani otentikasi dan berbagai tipe respons (JSON, blob).
 * @param {string} url - URL endpoint.
 * @param {object} options - Opsi untuk fetch().
 * @param {string} responseType - Tipe respons yang diharapkan ('json' atau 'blob').
 * @return {Promise<any>}
 */
const request = async (url, options = {}, responseType = 'json') => {
 const auth = getAuth();
 const user = auth.currentUser;
 const token = user ? await user.getIdToken() : null;

 const defaultHeaders = {
  'Content-Type': 'application/json',
 };

 if (token) {
  defaultHeaders['Authorization'] = `Bearer ${token}`;
 }
  // Hapus Content-Type jika mengirim FormData
 if (options.body instanceof FormData) {
  delete defaultHeaders['Content-Type'];
 }


 const config = {
  ...options,
  headers: {
   ...defaultHeaders,
   ...options.headers,
  },
 };

 try {
  const response = await fetch(url, config);

  if (!response.ok) {
        // Coba baca error sebagai teks, karena bisa jadi bukan JSON
   const errorText = await response.text();
   let errorData;
   try {
    errorData = JSON.parse(errorText);
   } catch (e) {
    errorData = { message: errorText || `Request failed with status: ${response.status}` };
   }
   throw new Error(errorData.message);
  }

    // Menangani respons berdasarkan tipe yang diminta
  if (responseType === 'blob') {
   return response.blob();
  }
    
  if (response.status === 204 || response.headers.get("content-length") === "0") {
   return { message: 'Operation successful' };
  }

  return response.json();
 } catch (error) {
  console.error("API Service Error:", error);
  throw error;
 }
};

// =====================================================================
// --- User & Auth ---
// =====================================================================
export const fetchUserProfile = (userId) => {
 if (!userId) {
  return Promise.reject(new Error("User ID diperlukan untuk mengambil profil."));
 }
 return request(`${API_BASE_URL}/users/profile/${userId}`);
};


// =====================================================================
// --- Units ---
// =====================================================================
export const fetchUserUnits = (userId) => request(`${API_BASE_URL}/units/user/${userId}`);
export const addUnitApi = (userId, unitName) => request(`${API_BASE_URL}/units/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify({ unit_name: unitName }),
});
export const updateUnitApi = (unitId, unitData) => request(`${API_BASE_URL}/units/${unitId}`, {
 method: 'PUT',
 body: JSON.stringify(unitData),
});
export const deleteUnitApi = (unitId) => request(`${API_BASE_URL}/units/${unitId}`, { method: 'DELETE' });


// =====================================================================
// --- Work Item Categories ---
// =====================================================================
export const fetchWorkItemCategories = (userId) => request(`${API_BASE_URL}/work-item-categories/user/${userId}`);
export const addWorkItemCategoryApi = (userId, categoryName) => request(`${API_BASE_URL}/work-item-categories/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify({ category_name: categoryName }),
});
export const updateWorkItemCategoryApi = (categoryId, categoryData) => request(`${API_BASE_URL}/work-item-categories/${categoryId}`, {
 method: 'PUT',
 body: JSON.stringify(categoryData),
});
export const deleteWorkItemCategoryApi = (categoryId) => request(`${API_BASE_URL}/work-item-categories/${categoryId}`, {
 method: 'DELETE',
});
export const updateWorkItemCategoriesOrderApi = (userId, categories) => request(`${API_BASE_URL}/work-item-categories/order/user/${userId}`, {
 method: 'PATCH',
 body: JSON.stringify({ categories }),
});


// =====================================================================
// --- Cash Flow Categories ---
// =====================================================================
export const fetchCashFlowCategories = (userId) => request(`${API_BASE_URL}/cash-flow-categories/user/${userId}`);
export const addCashFlowCategoryApi = (userId, categoryName) => request(`${API_BASE_URL}/cash-flow-categories/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify({ category_name: categoryName }),
});
export const updateCashFlowCategoryApi = (categoryId, categoryData) => request(`${API_BASE_URL}/cash-flow-categories/${categoryId}`, {
 method: 'PUT',
 body: JSON.stringify(categoryData),
});
export const deleteCashFlowCategoryApi = (categoryId) => request(`${API_BASE_URL}/cash-flow-categories/${categoryId}`, {
 method: 'DELETE',
});


// =====================================================================
// --- Material Prices ---
// =====================================================================
export const fetchMaterialPrices = (userId) => request(`${API_BASE_URL}/material-prices/user/${userId}`);
export const addMaterialPriceApi = (userId, priceData) => request(`${API_BASE_URL}/material-prices/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify({ ...priceData, userId }),
});
export const updateMaterialPriceApi = (priceId, priceData, userId) => request(`${API_BASE_URL}/material-prices/${priceId}`, {
 method: 'PUT',
 body: JSON.stringify({ ...priceData, userId }),
});
export const deleteMaterialPriceApi = (priceId) => request(`${API_BASE_URL}/material-prices/${priceId}`, {
 method: 'DELETE',
});


// =====================================================================
// --- Work Item Definitions (Templates) ---
// =====================================================================
export const fetchWorkItemDefinitions = (userId) => request(`${API_BASE_URL}/work-item-definitions/user/${userId}`);
export const addWorkItemDefinitionApi = (userId, definitionData) => request(`${API_BASE_URL}/work-item-definitions/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify(definitionData),
});
export const updateWorkItemDefinitionApi = (userId, definitionId, definitionData) => request(`${API_BASE_URL}/work-item-definitions/${definitionId}/user/${userId}`, {
 method: 'PUT',
 body: JSON.stringify(definitionData),
});
export const deleteWorkItemDefinitionApi = (userId, definitionId) => request(`${API_BASE_URL}/work-item-definitions/${definitionId}/user/${userId}`, {
 method: 'DELETE',
});


// =====================================================================
// --- Projects ---
// =====================================================================
export const fetchProjects = (userId) => request(`${API_BASE_URL}/projects/user/${userId}`);
export const createProjectApi = (userId, projectData) => request(`${API_BASE_URL}/projects/user/${userId}`, {
 method: 'POST',
 body: JSON.stringify(projectData),
});
export const updateProjectApi = (userId, projectId, projectData) => {
 const payload = { ...projectData, projectPrice: parseFloat(projectData.projectPrice) || 0 };
 return request(`${API_BASE_URL}/projects/${projectId}?userId=${userId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
 });
};
export const deleteProjectApi = (userId, projectId) => request(`${API_BASE_URL}/projects/${projectId}/user/${userId}`, {
 method: 'DELETE',
});
export const fetchArchivedProjectsApi = (userId) => request(`${API_BASE_URL}/projects/user/${userId}/archived`);
export const archiveProjectApi = (userId, projectId) => request(`${API_BASE_URL}/projects/${projectId}/archive`, {
 method: 'PUT',
 body: JSON.stringify({ userId }),
});
export const unarchiveProjectApi = (userId, projectId) => request(`${API_BASE_URL}/projects/${projectId}/unarchive`, {
 method: 'PUT',
 body: JSON.stringify({ userId }),
});
export const fetchProjectByIdApi = (userId, projectId) => request(`${API_BASE_URL}/projects/${projectId}/user/${userId}`);


// =====================================================================
// --- Project Work Items ---
// =====================================================================
export const addWorkItemToProjectApi = (userId, projectId, workItemData) => request(`${API_BASE_URL}/projects/${projectId}/work-items?userId=${userId}`, {
 method: 'POST',
 body: JSON.stringify(workItemData),
});
export const updateWorkItemApi = (userId, projectId, workItemId, workItemData) => request(`${API_BASE_URL}/projects/${projectId}/work-items/${workItemId}?userId=${userId}`, {
 method: 'PUT',
 body: JSON.stringify(workItemData),
});
export const deleteWorkItemFromProjectApi = (projectId, workItemId) => request(`${API_BASE_URL}/projects/${projectId}/work-items/${workItemId}`, {
 method: 'DELETE',
});


// =====================================================================
// --- Project Cash Flow Entries ---
// =====================================================================
export const addCashFlowEntryApi = (userId, projectId, entryData) => request(`${API_BASE_URL}/projects/${projectId}/cashflow-entries?userId=${userId}`, {
 method: 'POST',
 body: JSON.stringify(entryData),
});
export const updateCashFlowEntryApi = (userId, projectId, entryId, entryData) => request(`${API_BASE_URL}/projects/${projectId}/cashflow-entries/${entryId}?userId=${userId}`, {
 method: 'PUT',
 body: JSON.stringify(entryData),
});
export const deleteCashFlowEntryApi = (projectId, entryId) => request(`${API_BASE_URL}/projects/${projectId}/cashflow-entries/${entryId}`, {
 method: 'DELETE',
});
export const fetchCashFlowSummaryByMonthApi = async (userId, month) => {
 let url = `${API_BASE_URL}/projects/summary/cashflow?userId=${encodeURIComponent(userId)}`;
 if (month) {
  url += `&month=${encodeURIComponent(month)}`;
 }
 return request(url);
};


// =====================================================================
// --- Reports & Downloads ---
// =====================================================================
/**
 * Mengunduh laporan proyek dalam format PDF.
 * @param {string} userId - ID pengguna untuk otorisasi.
 * @param {string} projectId - ID proyek yang laporannya akan dibuat.
 * @return {Promise<Blob>}
 */
export const downloadProjectReportApi = (userId, projectId) => {
    // ✅ TAMBAHKAN userId sebagai query parameter di URL
    const url = `${API_BASE_URL}/projects/${projectId}/report?userId=${encodeURIComponent(userId)}`;
    
    // Panggil helper 'request' dengan URL baru dan tipe respons 'blob'
    return request(
        url, 
        { method: 'GET' }, 
        'blob'
    );
};
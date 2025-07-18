import React from 'react';
import { RefreshCcw } from 'lucide-react';

function ArchivedProjectsListView({ archivedProjects, isLoading, handleUnarchiveProject }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-lg text-gray-600">Memuat Proyek yang Diarsipkan...</p>
      </div>
    );
  }

  if (!archivedProjects || archivedProjects.length === 0) {
    return <p className="text-center text-gray-500 mt-6">Belum ada proyek yang diarsipkan.</p>;
  }

  return (
    <div className="bg-white border border-gray-200 shadow-xl rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-sky-600 mb-6">Proyek yang Diarsipkan</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Proyek
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Dibuat
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Biaya
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Keluarkan dari Arsip</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {archivedProjects.map(project => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{new Date(project.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.total_budget_plan_cost || 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleUnarchiveProject(project.id)}
                    title="Keluarkan dari Arsip"
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center text-sm shadow-sm"
                  >
                    <RefreshCcw size={16} className="mr-2" /> Keluarkan dari Arsip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ArchivedProjectsListView;
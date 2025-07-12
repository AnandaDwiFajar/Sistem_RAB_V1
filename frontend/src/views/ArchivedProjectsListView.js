import React from 'react';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

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
      <ul className="space-y-4">
        {archivedProjects.map(project => (
          <li key={project.id} className="bg-gray-50 border border-gray-200 p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center shadow-sm space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-700">{project.project_name}</h3>
              <p className="text-xs text-gray-500">
                Diarsipkan pada: {project.archived_at ? new Date(project.archived_at).toLocaleDateString('id-ID') : 'N/A'}
              </p>
            </div>
            <button
              onClick={() => handleUnarchiveProject(project.id)}
              title="Keluarkan dari Arsip"
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center text-sm shadow-sm self-start sm:self-center"
            >
              <RefreshCcw size={16} className="mr-2" /> Keluarkan dari Arsip
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ArchivedProjectsListView;
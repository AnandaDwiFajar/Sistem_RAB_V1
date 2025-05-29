import React from 'react';
import { RefreshCcw, ArrowLeft } from 'lucide-react'; // Assuming you might want an unarchive icon

function ArchivedProjectsListView({ archivedProjects, isLoading, handleUnarchiveProject }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-lg text-slate-300">Loading Archived Projects...</p>
      </div>
    );
  }

  if (!archivedProjects || archivedProjects.length === 0) {
    return <p className="text-center text-slate-400 mt-6">No projects have been archived yet.</p>;
  }

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-sky-400 mb-6">Archived Projects</h2>
      <ul className="space-y-4">
        {archivedProjects.map(project => (
          <li key={project.id} className="bg-slate-700/50 p-4 rounded-md flex justify-between items-center shadow">
            <div>
              <h3 className="text-lg font-medium text-slate-100">{project.project_name}</h3>
              <p className="text-xs text-slate-400">
                Archived on: {project.archived_at ? new Date(project.archived_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <button
              onClick={() => handleUnarchiveProject(project.id)}
              title="Unarchive Project"
              className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors flex items-center text-sm"
            >
              <RefreshCcw size={16} className="mr-2" /> Unarchive
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ArchivedProjectsListView;
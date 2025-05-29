// components/modals/InsightsModal.js
import React from 'react';
import { Sparkles, XCircle, Loader2 } from 'lucide-react';

const InsightsModal = ({
  showInsightsModal,
  setShowInsightsModal,
  currentProject,
  isFetchingProjectInsights,
  projectInsights
}) => {
  if (!showInsightsModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[90] p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-400 flex items-center">
            <Sparkles size={22} className="mr-2 text-purple-400"/>
            Project Insights for: {currentProject?.project_name}
          </h3>
          <button onClick={() => setShowInsightsModal(false)} className="p-1 text-slate-400 hover:text-white">
            <XCircle size={24}/>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow pr-2 text-slate-300">
          {isFetchingProjectInsights ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 size={48} className="text-purple-500 animate-spin mb-4"/>
              <p>✨ Generating insights with AI...</p>
            </div>
          ) : (
            <div
              className="prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: projectInsights.replace(/\n/g, '<br />') }}
            ></div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-700 text-right">
          <button
            onClick={() => setShowInsightsModal(false)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsModal;

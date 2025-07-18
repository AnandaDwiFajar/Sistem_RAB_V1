import React from 'react';
import { Archive, RefreshCcw, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

const NoArchivedProjects = () => (
    <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
        <Archive size={48} className="mx-auto text-industrial-gray" />
        <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Arsip Proyek</h3>
        <p className="mt-2 text-industrial-gray-dark">Proyek yang diarsipkan akan muncul di sini.</p>
    </div>
);

const ArchivedProjectsTable = ({ projects, onUnarchive }) => (
    <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
        <table className="w-full min-w-max text-left">
            <thead className="bg-gray-50 border-b border-industrial-gray-light">
                <tr>
                    <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Nama Proyek</th>
                    <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">Tanggal Dibuat</th>
                    <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-center">Total Anggaran</th>
                    <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="text-industrial-dark">
                {projects.map(project => (
                    <tr key={project.id} className="border-b border-industrial-gray-light hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium">{project.project_name}</td>
                        <td className="p-4 text-industrial-gray-dark">{formatDate(project.created_at)}</td>
                        <td className="p-4 font-semibold text-center">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.total_budget_plan_cost || 0)}
                        </td>
                        <td className="p-4 text-right">
                            <button
                                onClick={() => onUnarchive(project.id)}
                                title="Keluarkan dari Arsip"
                                className="p-2 text-industrial-gray-dark hover:text-industrial-accent transition-colors"
                            >
                                <RefreshCcw size={16}/>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

function ArchivedProjectsListView({ archivedProjects, isLoading, handleUnarchiveProject }) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 text-industrial-gray">
                <Loader2 className="animate-spin mr-2" />
                <span>Memuat arsip proyek...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-industrial-dark">Proyek yang Diarsipkan</h1>
            {(!archivedProjects || archivedProjects.length === 0)
                ? <NoArchivedProjects />
                : <ArchivedProjectsTable projects={archivedProjects} onUnarchive={handleUnarchiveProject} />
            }
        </div>
    );
}

export default ArchivedProjectsListView;
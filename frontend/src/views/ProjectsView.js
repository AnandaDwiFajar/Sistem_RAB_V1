import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Briefcase, PlusCircle, Archive, XCircle, Edit3, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const ProjectsView = () => {
    const navigate = useNavigate();
    // Menggunakan useOutletContext untuk mendapatkan manager
    const { projectsManager, userData } = useOutletContext();
    const { userRole } = userData; // Asumsi userRole ada di dalam userData

    // Tampilkan loading jika manager belum tersedia
    if (!projectsManager || !userData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2" /> Memuat...
            </div>
        );
    }

    const {
        projects = [],
        isLoading,
        handleDeleteProject,
        handleArchiveProject,
        handleStartEditProject,
    } = projectsManager;

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const NoProjectsDisplay = () => (
        <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
            <Briefcase size={48} className="mx-auto text-industrial-gray" />
            <h3 className="mt-4 text-xl font-semibold text-industrial-dark">Belum Ada Proyek</h3>
            <p className="mt-2 text-industrial-gray-dark">Mulai dengan membuat proyek baru untuk mengelola anggaran dan pekerjaan Anda.</p>
            <div className="mt-6">
                <button
                    onClick={() => handleStartEditProject(null)}
                    className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={20} className="mr-2"/> Buat Proyek Baru
                </button>
            </div>
        </div>
    );

    const ProjectCard = ({ project }) => (
        <div
            onClick={() => handleProjectClick(project.id)}
            className="bg-white rounded-lg shadow-md border transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 border-industrial-gray-light flex flex-col justify-between"
        >
            <div className="p-5">
                <h3 className="font-bold text-industrial-dark text-lg mb-2 truncate" title={project.project_name}>
                    {project.project_name}
                </h3>
                <p className="text-sm text-industrial-gray-dark mb-4">{project.customer_name || 'N/A'}</p>
                <div className="text-xs text-industrial-gray">
                    <span>Dibuat: {formatDate(project.created_at)}</span>
                </div>
            </div>
            {/* Hanya Admin yang bisa edit/hapus/arsip */}
                <div className="border-t border-industrial-gray-light bg-gray-50/50 px-5 py-2 flex justify-end space-x-2 text-xs">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleStartEditProject(project.id); }}
                        className="flex items-center p-1.5 text-industrial-gray-dark hover:text-industrial-accent transition-colors" title="Edit Proyek">
                        <Edit3 size={14} className="mr-1"/> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                        className="flex items-center p-1.5 text-yellow-500 hover:text-yellow-600 transition-colors" title="Arsipkan Proyek">
                        <Archive size={14} className="mr-1"/> Arsipkan
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="flex items-center p-1.5 text-red-500 hover:text-red-700 transition-colors" title="Hapus Proyek">
                        <XCircle size={14} className="mr-1"/> Hapus
                    </button>
                </div>
        </div>
    );

    const ProjectGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(proj => (
                <ProjectCard key={proj.id} project={proj} />
            ))}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="pb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-industrial-dark">Proyek Aktif</h1>
                    <button
                        onClick={() => handleStartEditProject(null)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                    >
                        <PlusCircle size={18} className="mr-2"/> Buat Proyek Baru
                    </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin mr-2" /> Memuat proyek...
                </div>
            ) : (
                projects.length === 0 ? <NoProjectsDisplay /> : <ProjectGrid />
            )}
        </div>
    );
};

export default React.memo(ProjectsView);
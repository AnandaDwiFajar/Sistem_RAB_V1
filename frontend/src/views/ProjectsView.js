import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, PlusCircle, Archive, XCircle, Edit3 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const ProjectsView = ({ projectsManager, userRole }) => {
    const navigate = useNavigate();

    if (!projectsManager) {
        return <div className="text-center p-4">Memuat data proyek...</div>;
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
            className="bg-white rounded-lg shadow-md border transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 border-industrial-gray-light"
        >
            <div className="p-5">
                <h3 className="font-bold text-industrial-dark text-lg mb-2 truncate" title={project.project_name}>
                    {project.project_name}
                </h3>
                <p className="text-sm text-industrial-gray-dark mb-4">{project.customer_name || 'Tanpa klien'}</p>
                <div className="text-xs text-industrial-gray">
                    <span>Dibuat: {formatDate(project.created_at)}</span>
                </div>
            </div>
                <div className="border-t border-industrial-gray-light bg-gray-50/50 px-5 py-2 flex justify-end space-x-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleStartEditProject(project.id); }}
                        className="flex items-center p-1.5 text-industrial-gray-dark hover:text-industrial-accent transition-colors" title="Edit Proyek">
                        <Edit3 size={16}/> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                        className="flex items-center p-1.5 text-yellow-500 hover:text-yellow-600 transition-colors" title="Arsipkan Proyek">
                        <Archive size={16}/>Arsipkan
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="flex items-center p-1.5 text-red-500 hover:text-red-700 transition-colors" title="Hapus Proyek">
                        <XCircle size={16}/>Hapus
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-industrial-dark">Proyek Aktif</h1>
                <button
                    onClick={() => handleStartEditProject(null)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors"
                >
                    <PlusCircle size={18} className="mr-2"/> Buat Proyek Baru
                </button>
            </div>
            
            {!isLoading && projects.length === 0 ? <NoProjectsDisplay /> : <ProjectGrid />}
        </div>
    );
};

export default React.memo(ProjectsView);
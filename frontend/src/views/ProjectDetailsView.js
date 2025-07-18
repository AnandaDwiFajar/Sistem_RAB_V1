import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useWorkItemDefinitions } from '../hooks/useWorkItemDefinitions';
import { useMaterialPrices } from '../hooks/useMaterialPrices';
import { useUserData } from '../hooks/useUserData';
import CurrentProjectDetailsHeader from './CurrentProjectDetailsHeader';
import { Loader2 } from 'lucide-react';
import ProjectWorkItemsView from './ProjectWorkItemsView';
import ProjectCashFlowView from './ProjectCashFlowView';

const ProjectDetailsView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [currentProjectView, setCurrentProjectView] = useState('workItems');

    const userData = useUserData();
    const materialPricesManager = useMaterialPrices(userData.userUnits, userData.setUserUnits);
    const definitionsManager = useWorkItemDefinitions(materialPricesManager.materialPrices, userData.userWorkItemCategories, userData.userUnits);
    const projectsManager = useProjects(definitionsManager.userWorkItemTemplates, materialPricesManager.materialPrices, userData.userUnits, userData.userWorkItemCategories);

    const { fetchProjectById, currentProject, isLoading, error } = projectsManager;

    useEffect(() => {
        if (projectId) {
            fetchProjectById(projectId);
        }
    }, [projectId, fetchProjectById]);

    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Memuat data proyek...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    if (!currentProject) {
        return <div className="text-center p-8">Proyek tidak ditemukan. <button onClick={() => navigate('/projects')} className="text-industrial-accent hover:underline">Kembali ke daftar proyek</button></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-industrial-dark">Detail Proyek</h1>
                    <p className="text-sm text-industrial-gray-dark mt-1">
                        <Link to="/projects" className="text-industrial-accent hover:underline">Daftar Proyek</Link> / {currentProject.project_name}
                    </p>
                </div>
            </div>

            <CurrentProjectDetailsHeader
                {...projectsManager}
                currentProject={currentProject}
                currentProjectView={currentProjectView}
                setCurrentProjectView={setCurrentProjectView}
            />
            
            <div className="mt-6">
                {currentProjectView === 'workItems' ? (
                    <ProjectWorkItemsView 
                        currentProject={currentProject}
                        definitionsManager={definitionsManager}
                        userWorkItemCategories={userData.userWorkItemCategories}
                        {...projectsManager}
                    />
                ) : (
                    <ProjectCashFlowView 
                        currentProject={currentProject}
                        userCashFlowCategories={userData.userCashFlowCategories}
                        {...projectsManager}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectDetailsView;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import CurrentProjectDetailsHeader from './CurrentProjectDetailsHeader';
import { Loader2 } from 'lucide-react';
import ProjectWorkItemsView from './ProjectWorkItemsView';
import ProjectCashFlowView from './ProjectCashFlowView';
import WelcomeDashboard from './WelcomeDashboard'; // Impor komponen WelcomeDashboard
import ProjectReport from './ProjectReport'; // <-- TAMBAHKAN IMPOR INI

const ProjectDetailsView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    // Ambil semua manager dari Outlet context yang disediakan oleh AppLayout
    const { projectsManager, definitionsManager, userData } = useOutletContext();

    const { 
        fetchProjectById, 
        currentProject, 
        isLoading, 
        error,
        currentProjectView,
        setCurrentProjectView,
        handleGenerateProjectReport,
        reportContentRef,
    } = projectsManager;

    useEffect(() => {
        if (projectId) {
            fetchProjectById(projectId);
        } else {
            // Jika tidak ada projectId, set currentProject ke null
            projectsManager.setCurrentProject(null);
        }
        // Cleanup function
        return () => {
            if (projectId) {
                projectsManager.setCurrentProject(null); 
            }
        };
    }, [projectId, fetchProjectById]);

    // Tampilkan WelcomeDashboard jika tidak ada projectId
    if (!projectId) {
        return <WelcomeDashboard />;
    }

    if (isLoading || !projectsManager || !definitionsManager || !userData) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Memuat data proyek...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    if (!currentProject) {
        return (
            <div className="text-center p-8">
                <p>Proyek tidak ditemukan atau sedang dimuat...</p>
                <button onClick={() => navigate('/projects')} className="mt-4 text-industrial-accent hover:underline">
                    Kembali ke Daftar Proyek
                </button>
            </div>
        );
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
                currentProject={currentProject}
                currentProjectView={currentProjectView}
                setCurrentProjectView={setCurrentProjectView}
                // Teruskan fungsi yang relevan dari projectsManager
                handleArchiveProject={() => projectsManager.handleArchiveProject(currentProject.id)}
                handleDeleteProject={() => projectsManager.handleDeleteProject(currentProject.id)}
                handleStartEditProject={() => projectsManager.handleStartEditProject(currentProject)}
                handleGenerateProjectReport={() => projectsManager.handleGenerateProjectReport(currentProject.id)}
                isGeneratingReport={projectsManager.isGeneratingReport}
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
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', zIndex: -1 }}>
                <ProjectReport
                  ref={reportContentRef}
                  project={currentProject}
                  allCategories={userData.userWorkItemCategories}
                />
            </div>
        </div>
    );
};

export default ProjectDetailsView;

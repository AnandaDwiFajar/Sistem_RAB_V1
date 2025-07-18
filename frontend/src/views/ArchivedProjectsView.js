import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ArchivedProjectsListView from './ArchivedProjectsListView'; // Pastikan path ini benar

function ArchivedProjectsView() {
  // Gunakan projectsManager dari konteks Outlet
  const { projectsManager } = useOutletContext();

  // Destructuring state dan fungsi yang relevan dari projectsManager
  const {
    archivedProjects,
    isLoading,
    fetchArchivedProjects,
    handleUnarchiveProject,
  } = projectsManager;

  // Panggil fetchArchivedProjects saat komponen pertama kali dirender
  useEffect(() => {
    fetchArchivedProjects();
  }, [fetchArchivedProjects]); // Tambahkan fetchArchivedProjects sebagai dependensi

  return (
    <ArchivedProjectsListView
      archivedProjects={archivedProjects}
      isLoading={isLoading}
      handleUnarchiveProject={handleUnarchiveProject}
    />
  );
}

export default ArchivedProjectsView;

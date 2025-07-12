return (
    <div className="space-y-6">
        {/* --- Header dan Tombol Aksi Utama --- */}
        <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-3xl font-semibold text-sky-600 flex items-center">
                <Briefcase size={30} className="mr-3"/>Proyek Saya
            </h2>
            <div className="flex space-x-3">
                {userRole === 'admin' && (
                    <button
                        onClick={() => setCurrentView('archivedProjects')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-md flex items-center"
                    >
                        <Archive size={20} className="mr-2"/> Lihat Arsip
                    </button>
                )}
                {/* [2] Tombol ini sekarang membuka modal dengan memanggil handleStartEditProject(null) */}
                <button
                    onClick={() => handleStartEditProject(null)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow-md flex items-center"
                >
                    <PlusCircle size={20} className="mr-2"/> Buat Proyek Baru
                </button>
            </div>
        </div>

    {showProjectForm && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg space-y-4 animate-fadeIn">
            <h3 className="text-xl font-medium text-gray-700">
                {editingProjectId ? 'Edit Detail Proyek' : 'Buat Proyek Baru'}
            </h3>
            <input
        type="text" name="projectName" value={projectFormData.projectName}
        onChange={handleProjectFormChange} placeholder="Nama Proyek (wajib)"
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md ... "
    />

    {/* FIELD BARU: Nama Pelanggan */}
    <input
        type="text" name="customerName" value={projectFormData.customerName}
        onChange={handleProjectFormChange} placeholder="Nama Pelanggan"
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md ... "
    />

    {/* FIELD BARU: Lokasi */}
    <input
        type="text" name="location" value={projectFormData.location}
        onChange={handleProjectFormChange} placeholder="Lokasi Proyek"
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md ... "
    />
            <input
                type="number"
                name="projectPrice"
                value={projectFormData.projectPrice}
                onChange={handleProjectFormChange}
                placeholder="Harga Proyek (Contoh: 50000000)"
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md ... "
                min="0"
            />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Mulai</label>
                        <input
                            type="date"
                            name="startDate"
                            value={projectFormData.startDate}
                            onChange={handleProjectFormChange}
                            // [PERUBAHAN 1] Tambahkan styling kondisional untuk error
                            className={`w-full p-3 bg-gray-50 border rounded-md transition-colors ${
                                dateError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Tenggat</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={projectFormData.dueDate}
                            onChange={handleProjectFormChange}
                            className={`w-full p-3 bg-gray-50 border rounded-md transition-colors ${
                                dateError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                        />
                    </div>
                </div>
                {dateError && (
                    <p className="text-sm text-red-600 -mt-2">{dateError}</p>
                )}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button 
            onClick={() => { handleCancelEdit; setShowProjectForm(false); }} 
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
        >
            Batal
        </button>
        <button 
            onClick={handleSaveOrUpdateProject} 
            disabled={isSavingProject} 
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
        >
            <Save size={18} className="mr-2 -ml-1"/> 
            {isSavingProject ? 'Menyimpan...' : (editingProjectId ? 'Simpan Perubahan' : 'Buat Proyek')}
        </button>
            </div>
        </div>
    )}

        {/* Section for Listing Active Projects */}
        {isLoading && projects.length === 0 && !showProjectForm && (
            <div className="text-center p-4 text-gray-500">Memuat Proyek...</div>
        )}
        {!isLoading && projects.length === 0 && !showProjectForm && (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                <Info size={24} className="mx-auto mb-2 text-sky-500"/>
                Tidak ada proyek aktif. Buat proyek baru atau periksa arsip.
            </div>
        )}
        {projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(proj => (
                <div
                    key={proj.id}
                    className={`p-6 rounded-lg shadow-lg cursor-pointer transition-all duration-200 relative ${currentProjectId === proj.id ? 'bg-sky-50 border-2 border-sky-400 scale-105' : 'bg-white border border-gray-200 hover:shadow-xl'}`}
                    onClick={() => handleSelectProject(proj.id)}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 truncate" title={proj.project_name}>{proj.project_name}</h3>
                        {userRole === 'admin' && (
                            <div className="flex space-x-1 flex-shrink-0">
                                {/* Tombol edit sekarang memanggil handleStartEditProject dengan ID */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleStartEditProject(proj.id); }}
                                    className="p-1 text-sky-500 hover:text-sky-600"
                                    title="Edit Proyek"
                                >
                                    <Edit3 size={18}/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(proj.id); }} className="p-1 text-amber-500 hover:text-amber-600" title="Arsipkan Proyek">
                                    <Archive size={18}/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} className="p-1 text-red-500 hover:text-red-600" title="Hapus Proyek">
                                    <XCircle size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">Dibuat: {new Date(proj.created_at).toLocaleDateString('id-ID')}</p>
                    {currentProjectId === proj.id && <div className="absolute top-2 right-2 h-3 w-3 bg-sky-500 rounded-full animate-pulse" title="Selected"></div>}
                </div>
            ))}
            </div>
        )}

        {/* Section for Displaying Selected Project Details */}
        {currentProject && (
            <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-inner space-y-6 animate-fadeIn">
                <CurrentProjectDetailsHeader
                    userRole={userRole} // 3. TERUSKAN userRole ke komponen Header
                    currentProject={currentProject}
                    isFetchingProjectInsights={isFetchingProjectInsights}
                    handleFetchProjectInsights={handleFetchProjectInsights}
                    setShowInsightsModal={setShowInsightsModal}
                    currentProjectView={currentProjectView}
                    setCurrentProjectView={setCurrentProjectView}
                    handleGenerateProjectReport={handleGenerateProjectReport}
                    isGeneratingReport={isGeneratingReport}
                />
                {currentProject.is_archived ? (
                    <div className="p-6 bg-amber-50 border border-amber-300 rounded-lg text-center text-amber-700">
                         <Info size={32} className="mx-auto mb-3 text-amber-600"/>
                         <h4 className="text-xl font-semibold mb-2">Proyek diarsip</h4>
                         <p className="text-amber-600">Proyek ini telah diarsip.</p>
                         <p className="text-amber-500 text-sm mt-1">Anda bisa memulihkannya dari halaman Arsip.</p>
                    </div>
                ) : (
                    <>
                        {/* 4. TAMPILKAN DETAIL DAN TAB HANYA UNTUK ADMIN */}
                        {(userRole === 'admin') ? (
                            <>
                                {currentProjectView === 'workItems' &&
                                    <ProjectWorkItemsView
                                        currentProject={currentProject}
                                        showWorkItemForm={showWorkItemForm}
                                        setShowWorkItemForm={setShowWorkItemForm}
                                        workItemFormData={workItemFormData}
                                        handleWorkItemFormChange={handleWorkItemFormChange}
                                        userWorkItemTemplates={userWorkItemTemplates}
                                        userWorkItemCategories={userWorkItemCategories}
                                        calculatedWorkItemPreview={calculatedWorkItemPreview}
                                        setCalculatedWorkItemPreview={setCalculatedWorkItemPreview}
                                        handleAddWorkItemToProject={handleAddWorkItemToProject}
                                        isAddingWorkItem={isAddingWorkItem}
                                        handleDeleteWorkItem={handleDeleteWorkItem}
                                    />
                                }
                                {currentProjectView === 'cashFlow' &&
                                    <ProjectCashFlowView
                                        currentProject={currentProject}
                                        showCashFlowForm={showCashFlowForm}
                                        setShowCashFlowForm={setShowCashFlowForm}
                                        cashFlowFormData={cashFlowFormData}
                                        setCashFlowFormData={setCashFlowFormData}
                                        handleCashFlowFormChange={handleCashFlowFormChange}
                                        userCashFlowCategories={cashFlowCategories}
                                        editingCashFlowEntry={editingCashFlowEntry}
                                        setEditingCashFlowEntry={setEditingCashFlowEntry}
                                        handleSaveCashFlowEntry={handleSaveCashFlowEntry}
                                        isSavingCashFlowEntry={isSavingCashFlowEntry}
                                        handleEditCashFlowEntry={handleEditCashFlowEntry}
                                        handleDeleteCashFlowEntry={handleDeleteCashFlowEntry}
                                        handleDeleteCashFlowCategory={handleDeleteCashFlowCategory}
                                        setShowManageCashFlowCategoriesModal={setShowManageCashFlowCategoriesModal}
                                    />
                                }
                            </>
                        ) : (
                            // 5. TAMPILKAN PESAN INI UNTUK STAFF
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-700">
                                <Info size={24} className="mx-auto mb-2"/>
                                Anda hanya dapat membuat proyek baru. Detail dan pengeditan item pekerjaan hanya dapat diakses oleh Direktur.
                            </div>
                        )}
                    </>
                )}
            </div>
        )}
        {showProjectForm && (
            <ProjectFormModal
                showModal={showProjectForm}
                handleClose={() => setShowProjectForm(false)}
                formData={projectFormData}
                handleFormChange={setProjectFormData}
                handleSubmit={handleSaveOrUpdateProject}
                isSaving={isSavingProject}
                editingProjectId={editingProjectId}
                dateError={dateError}
            />
        )}
    </div>
);

<CurrentProjectDetailsHeader
userRole={userRole} // 3. TERUSKAN userRole ke komponen Header
currentProject={currentProject}
isFetchingProjectInsights={isFetchingProjectInsights}
handleFetchProjectInsights={handleFetchProjectInsights}
setShowInsightsModal={setShowInsightsModal}
currentProjectView={currentProjectView}
setCurrentProjectView={setCurrentProjectView}
handleGenerateProjectReport={handleGenerateProjectReport}
isGeneratingReport={isGeneratingReport}
/>
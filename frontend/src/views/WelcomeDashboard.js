import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Briefcase, PlusCircle, Calculator, ArrowRight, ClipboardList, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const WelcomeDashboard = () => {
    // Get all managers from context for a comprehensive dashboard
    const { projectsManager, definitionsManager, materialPricesManager, userData } = useOutletContext();

    // Destructure needed state and functions from each manager
    const { activeProjects, isLoading: isLoadingProjects, handleStartEditProject } = projectsManager;
    const { userWorkItemTemplates, isLoading: isLoadingDefinitions } = definitionsManager;
    const { materialPrices, isLoading: isLoadingPrices } = materialPricesManager;

    // Sort and slice recent projects, ensuring activeProjects is treated as an array
    const recentProjects = [...(activeProjects || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const handleCreateNewProject = () => {
        if (handleStartEditProject) {
            handleStartEditProject(null); // Passing null indicates a new project
        }
    };
    
    // Reusable component for statistics cards
    const StatCard = ({ icon, label, value, color, isLoading }) => (
        <div className={`p-6 rounded-lg shadow-md flex items-center space-x-4 bg-white border-l-4 ${color}`}>
            {icon}
            <div>
                <p className="text-sm font-medium text-industrial-gray-dark">{label}</p>
                {isLoading ? (
                    <Loader2 className="animate-spin mt-1 text-industrial-dark" size={24} />
                ) : (
                    <p className="text-2xl font-bold text-industrial-dark">{value}</p>
                )}
            </div>
        </div>
    );

    // Reusable component for quick action buttons
    const QuickActionButton = ({ icon, label, onClick, to }) => {
        const content = (<>{icon}<span>{label}</span></>);
        const className = "w-full flex items-center justify-center space-x-3 p-3 bg-industrial-accent text-white font-semibold rounded-lg hover:bg-industrial-accent-dark transition-colors text-sm";
        if (to) return <Link to={to} className={className}>{content}</Link>;
        return <button onClick={onClick} className={className}>{content}</button>;
    };

    // Show a global loader while initial project data is loading
    if (isLoadingProjects) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="animate-spin text-industrial-accent mb-4" size={48} />
                <p className="text-lg text-industrial-gray-dark">Memuat data dashboard...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-industrial-dark">Selamat Datang!</h1>
                <p className="text-industrial-gray-dark mt-1">Berikut adalah ringkasan Proyek RAB anda.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column (larger) */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white p-6 rounded-lg shadow-md border border-industrial-gray-light h-full">
                        <h2 className="text-xl font-bold text-industrial-dark mb-4">Proyek Terbaru</h2>
                        {recentProjects.length > 0 ? (
                            <ul className="space-y-4">
                                {recentProjects.map(project => (
                                    <li key={project.id} className="flex items-center justify-between p-4 rounded-md hover:bg-gray-50 transition-all">
                                        <div>
                                            <p className="font-semibold text-industrial-dark">{project.project_name}</p>
                                            <p className="text-sm text-industrial-gray-dark">
                                                Dibuat pada: {format(new Date(project.created_at), 'dd MMMM yyyy')}
                                            </p>
                                        </div>
                                        <Link to={`/project/${project.id}`} className="flex items-center text-sm font-medium text-industrial-accent hover:underline">
                                            Lihat Detail <ArrowRight size={16} className="ml-1" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-industrial-gray-dark flex flex-col justify-center items-center h-full py-10">
                                <Briefcase size={40} className="mx-auto mb-4 text-industrial-gray" />
                                <h3 className="font-semibold text-lg text-industrial-dark">Belum Ada Proyek Aktif</h3>
                                <p className="max-w-xs mx-auto mt-1">Mulai kelola pekerjaan konstruksi Anda dengan membuat proyek baru.</p>
                                <button onClick={handleCreateNewProject} className="mt-6 text-sm font-semibold text-white bg-industrial-accent py-2 px-4 rounded-lg hover:bg-industrial-accent-dark">
                                    Buat Proyek Pertama Anda
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Column (smaller) */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-industrial-dark mb-4">Ringkasan Data</h2>
                        <div className="space-y-4">
                            <StatCard 
                                icon={<Briefcase size={32} className="text-blue-500" />} 
                                label="Proyek Aktif" 
                                value={(activeProjects || []).length} 
                                color="border-blue-500"
                                isLoading={isLoadingProjects}
                            />
                            <StatCard 
                                icon={<ClipboardList size={32} className="text-green-500" />} 
                                label="Item Pekerjaan" 
                                value={Object.keys(userWorkItemTemplates || {}).length} 
                                color="border-green-500"
                                isLoading={isLoadingDefinitions}
                            />
                            <StatCard 
                                icon={<DollarSign size={32} className="text-yellow-500" />} 
                                label="Material Terdaftar" 
                                value={(materialPrices || []).length} 
                                color="border-yellow-500"
                                isLoading={isLoadingPrices}
                            />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-industrial-dark mb-4">Aksi Cepat</h2>
                        <div className="space-y-3">
                            <QuickActionButton icon={<PlusCircle size={18} />} label="Buat Proyek Baru" onClick={handleCreateNewProject} />
                            <QuickActionButton icon={<Calculator size={18} />} label="Buka Kalkulator" to="/calculation-simulator" />
                            <QuickActionButton icon={<Briefcase size={18} />} label="Lihat Semua Proyek" to="/projects" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WelcomeDashboard;

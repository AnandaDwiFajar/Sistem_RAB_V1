import React from 'react';
import { ClipboardList, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

const StaffDashboard = ({ definitionsManager, materialPricesManager, userData }) => {
    const { userWorkItemTemplates, isLoading: isLoadingDefinitions } = definitionsManager;
    const { materialPrices, isLoading: isLoadingPrices } = materialPricesManager;

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-industrial-dark">
                    Selamat Datang!
                </h1>
                <p className="text-lg text-gray-600">
                    Dashboard operasional untuk mengelola data master aplikasi.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-industrial-dark mb-4">Akses Cepat</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <QuickAccessCard
                                to="/work-item-definitions"
                                title="Kelola Item Pekerjaan"
                                icon={<ClipboardList className="w-8 h-8 text-white" />}
                                description="Buat dan kelola template item pekerjaan."
                                bgColor="bg-green-500"
                            />
                            <QuickAccessCard
                                to="/material-prices"
                                title="Kelola Harga Material"
                                icon={<DollarSign className="w-8 h-8 text-white" />}
                                description="Perbarui daftar harga material bangunan."
                                bgColor="bg-yellow-500"
                            />
                        </div>
                    </section>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-industrial-dark mb-4">Ringkasan Data</h2>
                        <div className="space-y-4">
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
                </div>
            </div>
        </div>
    );
};

const QuickAccessCard = ({ to, title, icon, description, bgColor }) => (
    <Link to={to} className={`block p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ${bgColor}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="mr-4">{icon}</div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <ArrowRight className="w-6 h-6 text-white" />
        </div>
        <p className="mt-2 text-white opacity-90">{description}</p>
    </Link>
);

export default StaffDashboard;

import React from 'react';
import { Briefcase, DollarSign, ClipboardList, Archive, LogOut } from 'lucide-react';

const Sidebar = ({ userRole, currentView, setCurrentView, handleLogout }) => {
    const navItems = {
        admin: [
            { id: 'projects', label: 'Proyek', icon: Briefcase },
            { id: 'materialPrices', label: 'Daftar Harga Satuan', icon: DollarSign },
            { id: 'workItemDefinitions', label: 'Komponen Pekerjaan', icon: ClipboardList },
            { id: 'archivedProjects', label: 'Arsip', icon: Archive },
        ],
        staff_operasional: [
            { id: 'materialPrices', label: 'Daftar Harga Satuan', icon: DollarSign },
            { id: 'workItemDefinitions', label: 'Komponen Pekerjaan', icon: ClipboardList },
        ],
    };

    const roleDisplayNames = {
        admin: 'Direktur',
        staff_operasional: 'Staff Operasional',
    };

    const getNavItems = () => navItems[userRole] || [];

    return (
        <div className="w-64 h-screen bg-industrial-dark text-industrial-light flex flex-col fixed top-0 left-0">
            <div className="p-6 border-b border-industrial-gray-dark">
                <h1 className="text-2xl font-bold text-industrial-accent">RAB Pro</h1>
                <p className="text-sm text-industrial-gray">{roleDisplayNames[userRole]}</p>
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {getNavItems().map(item => (
                        <li key={item.id} className="mb-2">
                            <button
                                onClick={() => setCurrentView(item.id)}
                                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                                    currentView === item.id ? 'bg-industrial-accent text-white' : 'hover:bg-industrial-gray-dark'
                                }`}
                            >
                                <item.icon size={20} className="mr-3" />
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-industrial-gray-dark">
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="w-full flex items-center p-3 rounded-md text-left transition-colors text-industrial-warning hover:bg-industrial-gray-dark"
                >
                    <LogOut size={20} className="mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
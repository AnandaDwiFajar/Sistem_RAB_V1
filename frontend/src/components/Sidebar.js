import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, DollarSign, ClipboardList, Archive, LogOut, Settings, Calculator } from 'lucide-react';

const Sidebar = ({ userRole, handleLogout }) => {
    const location = useLocation();

    const navItems = {
        admin: [
            { path: '/', label: 'Proyek', icon: Briefcase },
            { path: '/materials', label: 'Daftar Harga Satuan', icon: DollarSign },
            { path: '/definitions', label: 'Daftar Pekerjaan', icon: ClipboardList },
            { path: '/calculation-simulator', label: 'Simulasi Kalkulasi', icon: Calculator },
            { path: '/settings/units', label: 'Kelola Unit', icon: Settings },
            { path: '/settings/work-item-categories', label: 'Kelola Kategori Pekerjaan', icon: Settings },
            { path: '/archived', label: 'Arsip', icon: Archive },
        ],
        staff_operasional: [
            { path: '/materials', label: 'Daftar Harga Satuan', icon: DollarSign },
            { path: '/definitions', label: 'Daftar Pekerjaan', icon: ClipboardList },
            { path: '/calculation-simulator', label: 'Simulasi Kalkulasi', icon: Calculator },
            { path: '/settings/units', label: 'Kelola Unit', icon: Settings },
            { path: '/settings/work-item-categories', label: 'Kelola Kategori Pekerjaan', icon: Settings },
        ],
    };

    const roleDisplayNames = {
        admin: 'Direktur',
        staff_operasional: 'Staff Operasional',
    };

    const getNavItems = () => navItems[userRole] || [];

    return (
        <aside className="w-64 h-screen bg-industrial-dark text-industrial-light flex flex-col">
            <div className="p-6 border-b border-industrial-gray-dark">
                <h1 className="text-2xl font-bold text-industrial-accent">Sistem Informasi RAB</h1>
                <p className="text-sm text-industrial-gray">{roleDisplayNames[userRole]}</p>
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {getNavItems().map(item => (
                        <li key={item.path} className="mb-2">
                            <Link
                                to={item.path}
                                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                                    location.pathname === item.path ? 'bg-industrial-accent text-white' : 'hover:bg-industrial-gray-dark'
                                }`}
                            >
                                <item.icon size={20} className="mr-3 flex-shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-industrial-gray-dark">
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="w-full flex items-center p-3 rounded-md text-left transition-colors text-red-400 hover:bg-industrial-gray-dark"
                >
                    <LogOut size={20} className="mr-3" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

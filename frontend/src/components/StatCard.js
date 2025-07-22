import React from 'react';
import { Loader2 } from 'lucide-react';

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

export default StatCard;

import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = "text-white" }) => (
    <div className="bg-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
            {icon && <div className="p-2 bg-white/5 rounded-lg text-gray-400">{icon}</div>}
        </div>
        {trend && (
            <div className="flex items-center gap-1 text-xs">
                <span className="text-green-500 font-bold">{trend}</span>
                <span className="text-gray-500">vs last month</span>
            </div>
        )}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500" />
    </div>
);

export default StatCard;

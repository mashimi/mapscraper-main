import React from 'react';
import { Search, Database, Shield, Server, Settings, Activity } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const items = [
        { id: 'extraction', label: 'Extraction', icon: <Search size={20} /> },
        { id: 'leads', label: 'Database', icon: <Database size={20} /> },
        { id: 'proxies', label: 'Proxies', icon: <Shield size={20} /> },
        { id: 'logs', label: 'Live Logs', icon: <Activity size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-20 lg:w-64 bg-card border-r border-white/5 p-6 flex flex-col h-screen">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Server size={20} />
                </div>
                <span className="hidden lg:block font-bold text-xl tracking-tight">
                    Scrape<span className="text-blue-500">Cloud</span>
                </span>
            </div>

            <nav className="space-y-2 flex-1">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${activeTab === item.id
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {item.icon}
                        <span className="hidden lg:block font-semibold">{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    <div className="hidden lg:block">
                        <p className="text-sm font-bold">Admin Pro</p>
                        <p className="text-xs text-gray-500">enterprise-p1</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Download, Plus, Zap, Users, BarChart3, Clock, Shield, Activity } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import LeadTable, { Lead } from './components/LeadTable';
import JobCard, { Job } from './components/JobCard';

const SOCKET_URL = 'http://localhost:4000';
const socket = io(SOCKET_URL);

export default function MapScraperPro() {
    const [activeTab, setActiveTab] = useState('extraction');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('New York, NY');
    const [isScraping, setIsScraping] = useState(false);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('[Socket] Connected to server');
        });

        return () => {
            socket.off('connect');
        };
    }, []);

    const handleJobUpdate = useCallback((payload: any) => {
        setJobs(prev => {
            const exists = prev.find(j => j.id === payload.jobId);
            if (exists) {
                return prev.map(j => j.id === payload.jobId ? { ...j, ...payload } : j);
            }
            return [{ id: payload.jobId, ...payload }, ...prev];
        });

        if (payload.data) {
            setLeads(prev => {
                // Create a map of existing leads for fast lookup
                const leadMap = new Map(prev.map(l => [`${l.name}-${l.phone}`, l]));

                payload.data.forEach((newLead: Lead) => {
                    const key = `${newLead.name}-${newLead.phone}`;
                    if (leadMap.has(key)) {
                        // Merge enriched data (like sentiment) into existing lead
                        leadMap.set(key, { ...leadMap.get(key)!, ...newLead });
                    } else {
                        leadMap.set(key, newLead);
                    }
                });

                return Array.from(leadMap.values()).sort((a, b) => 0); // Keep original order or sort as needed
            });
        }

        if (payload.status === 'completed' || payload.status === 'failed') {
            setIsScraping(false);
        }
    }, []);

    const triggerJob = async () => {
        if (!keyword || !location) return;

        setIsScraping(true);
        try {
            const res = await fetch(`${SOCKET_URL}/api/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, location })
            });

            const data = await res.json();
            const newJob: Job = {
                id: data.jobId,
                keyword,
                location,
                status: 'queued',
                progress: 0
            };

            setJobs(prev => [newJob, ...prev]);

            // Listen for specific job updates
            socket.on(`job_update_${data.jobId}`, (payload) => {
                handleJobUpdate({ ...payload, jobId: data.jobId });
            });

        } catch (error) {
            console.error('Failed to trigger job:', error);
            setIsScraping(false);
        }
    };

    const exportCSV = () => {
        if (leads.length === 0) return;

        const headers = ['Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Website', 'AI Sentiment'];
        const csvContent = [
            headers.join(','),
            ...leads.map(l => [
                `"${l.name}"`,
                `"${l.category}"`,
                l.rating,
                `"${l.reviews}"`,
                `"${l.phone}"`,
                `"${l.website}"`,
                `"${l.sentiment || 'Pending'}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, `enriched_leads_${Date.now()}.csv`);
    };

    const exportJSON = () => {
        if (leads.length === 0) return;
        const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
        downloadFile(blob, `enriched_leads_${Date.now()}.json`);
    };

    const downloadFile = (blob: Blob, filename: string) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex h-screen bg-background text-gray-100 font-sans">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroller">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-widest mb-2">
                                <Zap size={14} className="fill-blue-500" />
                                {activeTab === 'leads' ? 'Lead Repository' : 'Live Pipeline'}
                            </div>
                            <h1 className="text-4xl font-black mb-2 tracking-tight">
                                {activeTab === 'leads' ? 'Business Database' : 'Enterprise Scraper'}
                            </h1>
                            <p className="text-gray-500 font-medium whitespace-pre-line">
                                {activeTab === 'leads'
                                    ? 'Manage and export your collected intelligence.'
                                    : 'Professional data extraction with Stealth & Real-time Sync.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportCSV}
                                disabled={leads.length === 0}
                                className="flex items-center gap-2 bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                .CSV
                            </button>
                            <button
                                onClick={exportJSON}
                                disabled={leads.length === 0}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Zap size={18} className="group-hover:scale-110 transition-transform" />
                                Clean .JSON
                            </button>
                        </div>
                    </header>

                    {activeTab === 'extraction' && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                <StatCard label="Total Leads" value={leads.length} icon={<Users size={20} />} trend="+12%" color="text-blue-400" />
                                <StatCard label="Active Jobs" value={jobs.filter(j => j.status === 'running').length} icon={<BarChart3 size={20} />} color="text-green-400" />
                                <StatCard label="Success Rate" value="99.8%" icon={<Zap size={20} />} />
                                <StatCard label="Avg. Depth" value="2.4s" icon={<Clock size={20} />} />
                            </div>

                            {/* Main Action Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-10">
                                    {/* Search Module */}
                                    <div className="bg-card border border-white/5 p-2 rounded-[2rem] flex flex-col md:flex-row gap-2 shadow-2xl relative">
                                        <div className="flex-1 flex flex-col md:flex-row items-center">
                                            <input
                                                className="w-full bg-transparent px-6 py-4 outline-none text-lg font-medium placeholder:text-gray-600"
                                                placeholder="Search Keyword (e.g. Italian Restaurants)"
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value)}
                                            />
                                            <div className="hidden md:block w-px h-8 bg-white/10" />
                                            <input
                                                className="w-full md:w-64 bg-transparent px-6 py-4 outline-none text-lg font-medium placeholder:text-gray-600"
                                                placeholder="Location"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={triggerJob}
                                            disabled={isScraping || !keyword}
                                            className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isScraping ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                            {isScraping ? 'SCRAPING...' : 'LAUNCH'}
                                        </button>
                                    </div>

                                    {/* Data Table */}
                                    <LeadTable leads={leads} />
                                </div>

                                {/* Sidebar Stats/Jobs */}
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-2">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Active Pipelines</h3>
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>

                                    <div className="space-y-4">
                                        {jobs.length === 0 ? (
                                            <div className="border-2 border-dashed border-white/5 rounded-3xl p-10 text-center">
                                                <p className="text-gray-600 text-sm font-medium">No pipelines running.</p>
                                            </div>
                                        ) : (
                                            jobs.map(job => <JobCard key={job.id} job={job} />)
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'leads' && (
                        <div className="space-y-6">
                            <LeadTable leads={leads} />
                        </div>
                    )}

                    {activeTab === 'proxies' && (
                        <div className="max-w-3xl space-y-8">
                            <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
                                <div className="p-5 bg-blue-600/10 rounded-full text-blue-500 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                                    <Shield size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black mb-2 tracking-tight">Proxy Stealth Engine</h2>
                                    <p className="text-gray-500 font-medium">Auto-rotating residential proxies are active by default.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Status</p>
                                        <p className="text-green-400 font-bold">Encrypted</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Region</p>
                                        <p className="text-white font-bold">Smart-Global</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] h-[600px] flex flex-col font-mono text-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                                <Activity size={18} className="text-blue-500" />
                                <span className="font-bold text-gray-400 uppercase tracking-widest text-xs">Live System Logs</span>
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto scroller text-gray-500">
                                <p><span className="text-blue-500/50">[12:45:01]</span> System initialized...</p>
                                <p><span className="text-blue-500/50">[12:45:03]</span> Stealth browser engine ready.</p>
                                <p><span className="text-blue-500/50">[12:45:10]</span> WebSocket connection established.</p>
                                {jobs.length > 0 && <p><span className="text-green-500/50">[{new Date().toLocaleTimeString()}]</span> Last job: {jobs[0].keyword} processed.</p>}
                                <p className="animate-pulse">_</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="bg-card border border-white/5 p-8 rounded-[2.5rem]">
                                <h3 className="font-black mb-6 uppercase tracking-widest text-xs text-gray-500">API Configuration</h3>
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-400">Gemini AI Model</label>
                                        <select className="bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-blue-500/50">
                                            <option>Gemini 3 Flash (Optimized)</option>
                                            <option>Gemini 1.5 Pro (Deep)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-400">Scraping Threads</label>
                                        <input type="range" className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <div className="flex justify-between text-[10px] font-black text-gray-600">
                                            <span>Eco (1)</span>
                                            <span>Turbo (10)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            className={className}
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

// Icons for the placeholders
export { };

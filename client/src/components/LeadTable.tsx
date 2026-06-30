import React from 'react';
import { ExternalLink, Phone, Star, Sparkles, Mail, Globe, MapPin } from 'lucide-react';

export interface Lead {
    id?: string;
    name: string;
    rating: string;
    reviews: string;
    phone: string;
    email?: string;
    website: string;
    category: string;
    sentiment?: string;
}

interface LeadTableProps {
    leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
    return (
        <div className="group/container relative bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:border-blue-500/20">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="relative p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        Extraction Results
                        {leads.length > 0 && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Verified business intelligence from live sources.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20 font-black shadow-lg shadow-blue-500/5">
                        {leads.length} Records Found
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto scroller relative">
                <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 bg-white/[0.01]">
                        <tr>
                            <th className="p-6">Business Identity</th>
                            <th className="p-6 text-center">Industry</th>
                            <th className="p-6">Performance</th>
                            <th className="p-6">AI Analysis</th>
                            <th className="p-6 text-right">Contact Hub</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <div className="p-4 bg-white/5 rounded-full">
                                            <Database size={32} />
                                        </div>
                                        <p className="text-gray-400 italic font-medium">Waiting for search initialization...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead, idx) => (
                                <tr key={idx} className="group/row hover:bg-white/[0.02] transition-all duration-300">
                                    <td className="p-6 max-w-[300px]">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-gray-100 group-hover/row:text-blue-400 transition-colors uppercase text-sm tracking-tight truncate">
                                                {lead.name}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                <MapPin size={10} className="text-blue-500/50" />
                                                Verified Entity
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-lg text-gray-400 font-black border border-white/5 uppercase tracking-widest group-hover/row:border-blue-500/20 transition-all">
                                            {lead.category}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={14} className="text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
                                                <span className="text-blue-400 font-black text-sm">{lead.rating}</span>
                                            </div>
                                            <span className="text-gray-600 text-[10px] font-black uppercase tracking-tighter">{lead.reviews} Reviews</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {lead.sentiment ? (
                                            <div className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 w-fit shadow-xl
                                                ${lead.sentiment === 'High Potential' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5' :
                                                    lead.sentiment === 'Good' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5' :
                                                        lead.sentiment === 'Risk' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                <Sparkles size={12} className={lead.sentiment === 'High Potential' ? 'animate-pulse' : ''} />
                                                {lead.sentiment}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-600 text-[10px] font-black uppercase animate-pulse tracking-widest">
                                                Analyzing...
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="flex gap-2">
                                                {lead.phone !== 'Hidden' && (
                                                    <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 border border-white/5 transition-all cursor-pointer group/icon" title={lead.phone}>
                                                        <Phone size={14} className="group-hover/icon:text-blue-400" />
                                                    </div>
                                                )}
                                                {lead.email && lead.email !== 'Not Found' && lead.email !== 'Finding...' && (
                                                    <div className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/10 transition-all cursor-pointer group/icon" title={lead.email}>
                                                        <Mail size={14} className="group-hover/icon:scale-110 transition-transform" />
                                                    </div>
                                                )}
                                                {lead.website && (
                                                    <a
                                                        href={lead.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 border border-white/5 transition-all"
                                                    >
                                                        <Globe size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            {lead.email && lead.email !== 'Not Found' && lead.email !== 'No Website' && (
                                                <span className="text-[10px] font-mono text-blue-400/80 tracking-tighter lowercase">
                                                    {lead.email === 'Finding...' ? 'Locating Email...' : lead.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function Database({ size }: { size?: number }) {
    return (
        <svg
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    );
}

export default LeadTable;

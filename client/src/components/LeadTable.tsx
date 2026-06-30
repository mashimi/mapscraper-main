import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ExternalLink, Phone, Star, Sparkles, Mail, Globe, MapPin, Database } from 'lucide-react';

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
    const parentRef = React.useRef<HTMLDivElement>(null);

    // The magic virtualizer
    const rowVirtualizer = useVirtualizer({
        count: leads.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 96,
        overscan: 10,
    });

    return (
        <div className="group/container relative bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="relative p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        Extraction Results
                        {leads.length > 0 && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Enterprise database synced via Firebase Firestore.</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20 font-black shadow-lg shadow-blue-500/5">
                    {leads.length.toLocaleString()} Records
                </span>
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-8 py-4 text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 bg-white/[0.01] border-b border-white/5">
                <div>Business Identity</div>
                <div className="text-center">Industry</div>
                <div>Performance</div>
                <div>AI Analysis</div>
                <div className="text-right">Contact Hub</div>
            </div>

            <div ref={parentRef} className="overflow-y-auto scroller relative" style={{ height: '600px' }}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const lead = leads[virtualRow.index];
                        return (
                            <div
                                key={virtualRow.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-8 items-center hover:bg-white/[0.02] border-b border-white/[0.03] transition-all"
                            >
                                <div className="py-6 max-w-[300px]">
                                    <span className="font-black text-gray-100 hover:text-blue-400 transition-colors uppercase text-sm tracking-tight truncate block">
                                        {lead.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        <MapPin size={10} className="text-blue-500/50" /> Verified Entity
                                    </div>
                                </div>

                                <div className="text-center">
                                    <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-lg text-gray-400 font-black border border-white/5 uppercase tracking-widest">
                                        {lead.category}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-blue-400 font-black text-sm">{lead.rating}</span>
                                    </div>
                                    <span className="text-gray-600 text-[10px] font-black uppercase">{lead.reviews} Reviews</span>
                                </div>

                                <div>
                                    {lead.sentiment ? (
                                        <div className={`px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-xl
                                            ${lead.sentiment === 'High Potential' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                              lead.sentiment === 'Good' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                              lead.sentiment === 'Risk' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                              'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                            <Sparkles size={10} /> {lead.sentiment}
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-[10px] uppercase animate-pulse">Analyzing...</span>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2 py-4">
                                    <div className="flex gap-2">
                                        {lead.phone !== 'Hidden' && (
                                            <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 border border-white/5" title={lead.phone}>
                                                <Phone size={14} />
                                            </div>
                                        )}
                                        {lead.email && lead.email !== 'Not Found' && lead.email !== 'Error' && (
                                            <div className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/10" title={lead.email}>
                                                <Mail size={14} />
                                            </div>
                                        )}
                                        {lead.website && (
                                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 border border-white/5">
                                                <Globe size={14} />
                                            </a>
                                        )}
                                    </div>
                                    {lead.email && lead.email !== 'Not Found' && lead.email !== 'No Website' && (
                                        <span className="text-[10px] font-mono text-blue-400/80 lowercase truncate max-w-[150px]">
                                            {lead.email === 'Finding...' ? 'Locating...' : lead.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {leads.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                            <Database size={32} />
                            <p className="text-gray-400 italic font-medium">Database empty. Launch a scrape to populate.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadTable;
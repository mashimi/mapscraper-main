import React from 'react';
import { Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

export interface Job {
    id: string;
    keyword: string;
    location: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'extracting_contacts' | 'enriching';
    progress: number;
}

interface JobCardProps {
    job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
    const getStatusIcon = () => {
        switch (job.status) {
            case 'running':
            case 'extracting_contacts':
            case 'enriching':
                return <Loader2 size={16} className="animate-spin text-blue-500" />;
            case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'failed': return <XCircle size={16} className="text-red-500" />;
            default: return <Play size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="bg-card p-6 rounded-2xl border border-white/5 shadow-sm hover:border-blue-500/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-gray-200">{job.keyword}</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{job.location}</p>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
                    {getStatusIcon()}
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                        {job.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-blue-400 font-bold">{job.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ease-out ${job.status === 'failed' ? 'bg-red-500' :
                            job.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${job.progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default JobCard;

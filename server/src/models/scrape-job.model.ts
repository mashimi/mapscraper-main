import { z } from 'zod';

export const ScrapeJobSchema = z.object({
    keyword: z.string().min(1, "Keyword is required"),
    location: z.string().min(1, "Location is required"),
});

export type ScrapeJob = z.infer<typeof ScrapeJobSchema>;

export interface Lead {
    name: string;
    rating: string;
    reviews: string;
    phone: string;
    email?: string;
    website: string;
    category: string;
    sentiment?: string;
}

export interface JobStatus {
    jobId: string;
    progress: number;
    status: 'queued' | 'running' | 'completed' | 'failed';
    data?: Lead[];
    error?: string;
}

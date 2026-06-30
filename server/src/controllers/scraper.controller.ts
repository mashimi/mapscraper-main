import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { ScrapeJobSchema } from '../models/scrape-job.model';
import scraperService from '../services/scraper.service';
import { jobStore } from '../services/job-store';

class ScraperController {
    async startScrape(req: Request, res: Response, io: Server) {
        try {
            // Validate input using Zod as per skill: typesafe_fullstack
            const validatedData = ScrapeJobSchema.parse(req.body);
            const { keyword, location } = validatedData;

            const jobId = `job_${Date.now()}`;

            // Store initial status in store
            jobStore.setJob(jobId, { jobId, progress: 0, status: 'queued' });

            // Async scraping - don't await so we can return 202 immediately
            scraperService.scrape(jobId, keyword, location, io);

            return res.status(202).json({ jobId, status: 'queued' });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ status: 'error', message: error.errors });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }

    getJobStatus(req: Request, res: Response) {
        const { jobId } = req.params;
        const job = jobStore.getJob(jobId);
        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Job not found' });
        }
        return res.status(200).json(job);
    }
}

export default new ScraperController();

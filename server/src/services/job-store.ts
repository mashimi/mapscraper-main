import { JobStatus } from '../models/scrape-job.model';

class JobStore {
    private jobs: Map<string, { status: JobStatus; timestamp: number }> = new Map();

    setJob(jobId: string, status: JobStatus) {
        this.jobs.set(jobId, { status, timestamp: Date.now() });
    }

    getJob(jobId: string): JobStatus | undefined {
        return this.jobs.get(jobId)?.status;
    }

    // Automatic cleanup to prevent memory leaks during massive 500+ job runs
    cleanupOldJobs() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        let cleanedCount = 0;

        for (const [jobId, entry] of this.jobs.entries()) {
            if (entry.timestamp < oneHourAgo) {
                this.jobs.delete(jobId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) console.log(`[JobStore] Cleaned up ${cleanedCount} old jobs from memory.`);
    }
}

export const jobStore = new JobStore();

// Run cleanup every 10 minutes
setInterval(() => {
    jobStore.cleanupOldJobs();
}, 10 * 60 * 1000).unref();

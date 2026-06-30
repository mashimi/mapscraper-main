import { JobStatus } from '../models/scrape-job.model';

class JobStore {
    private jobs: Map<string, JobStatus> = new Map();

    setJob(jobId: string, status: JobStatus) {
        this.jobs.set(jobId, status);
    }

    getJob(jobId: string): JobStatus | undefined {
        return this.jobs.get(jobId);
    }
}

export const jobStore = new JobStore();

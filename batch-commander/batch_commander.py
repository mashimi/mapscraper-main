import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import asyncio
import csv
import hashlib
import logging
import signal
import argparse
from tqdm import tqdm

from config import settings
from api_client import ScraperAPIClient
from managers import CheckpointManager, JobTracker, Stats

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[
        logging.FileHandler(settings.log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Graceful Shutdown Event
shutdown_event = asyncio.Event()

def _signal_handler(sig, _):
    logger.warning(f"🛑 Received signal {sig}. Shutting down gracefully...")
    shutdown_event.set()

def generate_job_id(keyword: str, location: str) -> str:
    """Generates a collision-proof hash ID."""
    raw = f"{keyword}\x00{location}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

async def producer(
    queue: asyncio.Queue,
    tasks: list[tuple[str, str]],
    client: ScraperAPIClient,
    checkpoint: CheckpointManager,
    stats: Stats,
    pbar: tqdm
):
    """Submits jobs to the API and puts them in the polling queue."""
    submit_sem = asyncio.Semaphore(settings.max_concurrent_submits)
    
    async def submit_one(kw, loc):
        job_id = generate_job_id(kw, loc)
        async with submit_sem:
            if shutdown_event.is_set():
                pbar.update(1)
                return
                
            try:
                result = await client.submit_job(kw, loc)
                await queue.put((job_id, result.jobId))
                stats.submitted += 1
            except Exception as e:
                logger.error(f"❌ Submit FAILED: {kw} in {loc} | {e}")
                await checkpoint.mark_failed(job_id, str(e))
            finally:
                pbar.update(1)
        
        # Sleep OUTSIDE the semaphore to not waste the slot
        await asyncio.sleep(settings.submit_delay)

    await asyncio.gather(*[submit_one(kw, loc) for kw, loc in tasks])
    logger.info("✅ Producer finished submitting all jobs.")

async def consumer(
    consumer_id: int,
    queue: asyncio.Queue,
    client: ScraperAPIClient,
    checkpoint: CheckpointManager,
    tracker: JobTracker,
    stats: Stats
):
    """Polls the API for completed jobs and saves results."""
    while not (shutdown_event.is_set() and queue.empty()):
        try:
            job_id, api_job_id = await asyncio.wait_for(queue.get(), timeout=1.0)
        except asyncio.TimeoutError:
            continue

        while not shutdown_event.is_set():
            try:
                status = await client.check_job_status(api_job_id)
                if status.status == "completed":
                    await tracker.save_result(job_id, status.data or [])
                    await checkpoint.mark_completed(job_id)
                    stats.succeeded += 1
                    break
                elif status.status == "failed":
                    await checkpoint.mark_failed(job_id, status.error or "Unknown API error")
                    stats.failed += 1
                    break
                else:
                    await asyncio.sleep(settings.poll_delay)
            except Exception as e:
                logger.error(f"❌ Polling FAILED for {api_job_id} | {e}")
                await checkpoint.mark_failed(job_id, str(e))
                stats.failed += 1
                break
        
        queue.task_done()

async def main(args):
    logger.info("🚀 Starting Advanced Batch Commander...")
    
    # 1. Health Check
    client = ScraperAPIClient()
    if not await client.check_health():
        logger.error(f"❌ Node.js API is not reachable at {settings.api_base_url}. Aborting.")
        await client.close()
        return
    logger.info("✅ API Health Check Passed.")

    # 2. Init Managers
    checkpoint = CheckpointManager()
    checkpoint.load()
    tracker = JobTracker()
    stats = Stats()

    # 3. Load CSV
    tasks_to_run = []
    try:
        with open(settings.csv_file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                job_id = generate_job_id(row['keyword'], row['location'])
                if job_id not in checkpoint.completed and (args.fresh or job_id not in checkpoint.failed):
                    tasks_to_run.append((row['keyword'], row['location']))
    except FileNotFoundError:
        logger.error(f"❌ CSV file not found at {settings.csv_file_path}.")
        await client.close()
        return

    if not tasks_to_run:
        logger.info("🎉 All jobs from CSV are already completed or skipped!")
        await client.close()
        return

    if args.limit:
        tasks_to_run = tasks_to_run[:args.limit]

    logger.info(f"📋 Loaded {len(tasks_to_run)} new jobs to process.")

    # 4. Setup Queue & Concurrency
    queue = asyncio.Queue()
    pbar = tqdm(total=len(tasks_to_run), desc="Submitting Jobs", unit="job")

    # 5. Launch Producers & Consumers
    consumers = [
        asyncio.create_task(consumer(i, queue, client, checkpoint, tracker, stats))
        for i in range(settings.max_concurrent_polls)
    ]
    
    try:
        await producer(queue, tasks_to_run, client, checkpoint, stats, pbar)
        await queue.join()  # Wait for all polling to finish
    except asyncio.CancelledError:
        logger.warning("Shutdown requested. Waiting for in-flight jobs to finish...")
    finally:
        pbar.close()
        for c in consumers:
            c.cancel()
        await client.close()
        await checkpoint.shutdown()
        stats.log_summary()
        logger.info("🏁 Batch Commander finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Advanced Batch Commander")
    parser.add_argument("--fresh", action="store_true", help="Ignore failed jobs checkpoint and retry them")
    parser.add_argument("--limit", type=int, help="Maximum number of jobs to process this run")
    args = parser.parse_args()

    # Register signal handlers safely
    try:
        signal.signal(signal.SIGINT, _signal_handler)
        signal.signal(signal.SIGTERM, _signal_handler)
    except ValueError:
        pass

    asyncio.run(main(args))

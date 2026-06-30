import httpx
import logging
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception, before_sleep_log

from config import settings
from models import JobSubmissionResponse, JobStatusResponse

logger = logging.getLogger(__name__)

def should_retry_exception(exception: Exception) -> bool:
    """Only retry on network errors, timeouts, 429, and 5xx."""
    if isinstance(exception, (httpx.TimeoutException, httpx.NetworkError)):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        return exception.response.status_code in (429, 500, 502, 503, 504)
    return False

class ScraperAPIClient:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=settings.request_timeout)

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential_jitter(initial=1, max=60),
        retry=retry_if_exception(should_retry_exception),
        reraise=True,
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    async def submit_job(self, keyword: str, location: str) -> JobSubmissionResponse:
        payload = {"keyword": keyword, "location": location}
        try:
            response = await self.client.post(f"{settings.api_base_url}/api/jobs", json=payload)
            response.raise_for_status()
            return JobSubmissionResponse(**response.json())
        except httpx.HTTPStatusError as e:
            if not should_retry_exception(e):
                logger.error(f"Non-retryable API error {e.response.status_code}: {e.response.text}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=2, max=30),
        retry=retry_if_exception(should_retry_exception),
        reraise=True
    )
    async def check_job_status(self, api_job_id: str) -> JobStatusResponse:
        response = await self.client.get(f"{settings.api_base_url}/api/jobs/{api_job_id}")
        response.raise_for_status()
        return JobStatusResponse(**response.json())

    async def check_health(self) -> bool:
        try:
            response = await self.client.get(f"{settings.api_base_url}/api/health", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False

    async def close(self):
        await self.client.aclose()

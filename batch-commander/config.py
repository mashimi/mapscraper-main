from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    api_base_url: str = "http://localhost:4000"
    
    max_concurrent_submits: int = Field(5, ge=1, le=100)
    max_concurrent_polls: int = Field(10, ge=1, le=100)
    request_timeout: int = Field(30, ge=1)
    submit_delay: float = Field(1.0, ge=0)
    poll_delay: float = Field(2.0, ge=0)
    checkpoint_interval: int = Field(10, ge=1)
    
    csv_file_path: str = "african_suppliers.csv"
    progress_file: str = "progress.json"
    failed_file: str = "failed_jobs.json"
    results_file: str = "results.jsonl"
    log_file: str = "batch_commander.log"

settings = Settings()

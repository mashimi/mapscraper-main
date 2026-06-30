from pydantic import BaseModel
from typing import Optional, Any

class JobSubmissionResponse(BaseModel):
    jobId: str
    status: str = "queued"

class JobStatusResponse(BaseModel):
    jobId: str
    status: str
    data: Optional[list[dict[str, Any]]] = None
    error: Optional[str] = None

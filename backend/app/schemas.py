from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Union, Any

# --- 1. WHAT YOU EXPECT TO RECEIVE (Input) ---
# This tells your Proxy/Extension team: "Send me EXACTLY this."

class CookieData(BaseModel):
    name: str
    domain: str
    secure: Optional[bool] = False
    httpOnly: Optional[bool] = False

class PageMetadata(BaseModel):
    url: str  # Pydantic validates this is a real URL
    cookies: List[Union[CookieData, dict]]
    scripts: List[str] 
    content_snippet: str    # First 1000 chars of visible text

# --- 2. WHAT YOU PROMISE TO RETURN (Output) ---
# This tells your Extension team: "I will give you EXACTLY this."

class PrivacyRiskReport(BaseModel):
    risk_score: int         # 0 to 100
    risk_level: str         # "Safe", "Low", "Medium", "High", "Critical"
    summary: str            # 1-2 sentence explanation
    action_taken: str       # e.g., "Blocked 2 trackers"
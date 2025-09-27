from datetime import datetime, timedelta
from threading import Lock
from typing import Dict

from fastapi import HTTPException, status

from .config import get_settings

settings = get_settings()
_RATE_LIMIT_WINDOW = timedelta(seconds=settings.rate_limit_window_seconds)
_rate_limit_disabled = settings.rate_limit_disabled

_last_submission: Dict[int, datetime] = {}
_lock = Lock()


def _should_limit() -> bool:
    return not _rate_limit_disabled and _RATE_LIMIT_WINDOW.total_seconds() > 0


def ensure_can_submit(user_id: int) -> None:
    if not _should_limit():
        return

    now = datetime.utcnow()
    with _lock:
        last = _last_submission.get(user_id)
        if not last:
            return

        elapsed = now - last
        if elapsed >= _RATE_LIMIT_WINDOW:
            return

        seconds_left = int((_RATE_LIMIT_WINDOW - elapsed).total_seconds()) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Review submissions limited to one per minute. Try again in {seconds_left} seconds.",
        )


def note_submission(user_id: int) -> None:
    if not _should_limit():
        return

    now = datetime.utcnow()
    with _lock:
        _last_submission[user_id] = now

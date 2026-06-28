import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

async def dispatch_webhook_event(event_type: str, payload: dict):
    """
    Asynchronously dispatches webhook events to configured endpoints (e.g. Slack/Discord).
    """
    webhook_url = getattr(settings, "WEBHOOK_URL", None)
    if not webhook_url:
        logger.info(f"[Webhook] Event '{event_type}' triggered. Payload: {payload}")
        return

    formatted_message = f"🚀 *MechStrek Event [{event_type}]*\n```json\n{payload}\n```"
    async with httpx.AsyncClient() as client:
        try:
            await client.post(webhook_url, json={"text": formatted_message}, timeout=5.0)
            logger.info(f"[Webhook] Successfully dispatched '{event_type}' to {webhook_url}")
        except Exception as e:
            logger.error(f"[Webhook] Failed to dispatch '{event_type}': {e}")

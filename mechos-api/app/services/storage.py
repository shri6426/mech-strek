import httpx
import logging
import os
import uuid
import shutil
from app.core.config import settings

logger = logging.getLogger("mechos-api")

async def upload_file_to_supabase(
    file_bytes: bytes,
    filename: str,
    content_type: str
) -> str:
    """
    Upload file to Supabase Storage and return the public URL.
    Falls back to local file system storage if Supabase credentials are not set.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.warning("Supabase credentials not set. Falling back to local storage.")
        # Local upload fallback logic
        os.makedirs("uploads", exist_ok=True)
        saved_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join("uploads", saved_filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)
            
        return f"{settings.BACKEND_URL}/uploads/{saved_filename}"

    # Prepare Supabase Upload
    bucket = settings.SUPABASE_BUCKET
    # Unique path within bucket to prevent naming collisions
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{unique_filename}"
    
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "apikey": settings.SUPABASE_KEY,
        "Content-Type": content_type
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, content=file_bytes, headers=headers)
        if response.status_code != 200:
            logger.error(f"Supabase upload error ({response.status_code}): {response.text}")
            raise Exception(f"Supabase storage upload failed: {response.text}")
            
    # Public access URL
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{unique_filename}"

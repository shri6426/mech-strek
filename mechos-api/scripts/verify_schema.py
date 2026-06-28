import asyncio
import sys
from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.core.config import settings

async def verify_schema():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}")
    try:
        async with AsyncSessionLocal() as db:
            # 1. Verify connection
            await db.execute(text("SELECT 1"))
            print("[OK] Successfully connected to Supabase database")

            # 2. Check tables in the public schema
            result = await db.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            ))
            tables = [row[0] for row in result.all()]
            
            expected_tables = [
                'users', 'client_projects', 'project_milestones', 'project_tasks',
                'activity_feeds', 'client_files', 'invoices', 
                'project_messages', 'services', 'portfolio_projects', 
                'testimonials', 'inquiries'
            ]
            
            missing_tables = [t for t in expected_tables if t not in tables]
            
            if missing_tables:
                print(f"[ERROR] Missing expected tables: {missing_tables}")
                sys.exit(1)
            else:
                print(f"[OK] All {len(expected_tables)} expected tables found.")
                
            print("\nSchema verification passed! Database is ready for traffic.")
    except Exception as e:
        print(f"[ERROR] Connection or verification failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(verify_schema())

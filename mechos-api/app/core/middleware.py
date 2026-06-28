import time
import logging
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mechos-api")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        client_ip = request.client.host if request.client else "Unknown"
        
        # Log incoming request
        logger.info(
            f"Incoming Request | ID: {request_id} | IP: {client_ip} | "
            f"Method: {request.method} | Path: {request.url.path}"
        )
        
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            process_time = time.perf_counter() - start_time
            
            # Log completed request
            logger.info(
                f"Completed Request | ID: {request_id} | Status: {response.status_code} | "
                f"Time: {process_time:.4f}s"
            )
            
            # Add custom headers to response
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(
                f"Failed Request | ID: {request_id} | Error: {str(e)} | "
                f"Time: {process_time:.4f}s"
            )
            raise e

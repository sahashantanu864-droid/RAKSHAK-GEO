"""CITYSHIELD GIS - RAKSHAK-GEO FastAPI Main Entrypoint.

Provides the application instance, mounts API v1 routes, and enforces
production-grade security headers, CORS policies, request size limits,
and safe error handling.
"""
import logging
import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.router import api_router

logger = logging.getLogger("rakshak_geo.security")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# -----------------------------------------------------------------------------
# 1. CORS Configuration (Explicit Whitelist, no unrestricted '*')
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

# -----------------------------------------------------------------------------
# 2. In-Memory Rate Limiting for Compute-Intensive / Upstream Endpoints
# -----------------------------------------------------------------------------
# Maps client_ip -> (count, window_start_time)
_rate_limits: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))
RATE_LIMITED_PREFIXES = (
    "/api/v1/what-if/simulate",
    "/api/v1/future-gap/timeline",
    "/api/v1/optimization/allocate",
    "/api/v1/gis/isro/wms",
)


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Unified security middleware handling headers, request size, and rate limits."""
    # A. Check Content-Length size cap
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit():
        if int(content_length) > settings.MAX_REQUEST_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content={
                    "detail": "Request payload exceeds maximum allowed limit (10MB).",
                    "error_code": "PAYLOAD_TOO_LARGE",
                },
            )

    # B. Rate limiting on computationally expensive routes
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    if any(path.startswith(prefix) for prefix in RATE_LIMITED_PREFIXES):
        now = time.time()
        count, window_start = _rate_limits[client_ip]
        if now - window_start > 60.0:
            # Reset 1-minute window
            _rate_limits[client_ip] = (1, now)
        else:
            if count >= settings.RATE_LIMIT_PER_MINUTE:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Please throttle computation requests.",
                        "error_code": "RATE_LIMIT_EXCEEDED",
                        "retry_after_seconds": int(60 - (now - window_start)),
                    },
                    headers={"Retry-After": str(int(60 - (now - window_start)))},
                )
            _rate_limits[client_ip] = (count + 1, window_start)

    # C. Process Request
    response: Response = await call_next(request)

    # D. Inject Essential Production Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"

    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


# -----------------------------------------------------------------------------
# 3. Global Exception Handler (Prevent internal stack trace disclosure)
# -----------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions safely without exposing stack traces to clients."""
    logger.exception(f"Unhandled server error on path {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal operational error occurred. The incident response team has been alerted.",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


# -----------------------------------------------------------------------------
# 4. Health Check Endpoint
# -----------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint confirming API server readiness."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

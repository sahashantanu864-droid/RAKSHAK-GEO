"""Authentication and Authorization Security Boundary Framework.

Operational Architectural Boundaries:
1. PUBLIC / FIELD OPERATIONAL READ-ONLY ENDPOINTS:
   - /api/health: Read-only service availability probe.
   - /api/v1/city-data/*: Read-only geographic fixtures, municipal inventory, hospitals, shelters, and roads.
   - /api/v1/gis/isro/*: Read-only telemetry and proxied earth-observation tile access.
   - /api/v1/what-if/simulate: Ephemeral in-memory disaster response simulation.
   - /api/v1/future-gap/timeline: Ephemeral in-memory timeline projections.
   - /api/v1/optimization/allocate: Ephemeral deterministic resource solver.

2. RESTRICTED / FUTURE ADMINISTRATIVE WRITE ENDPOINTS:
   The following mutating operations require authentication and authorization:
   - Creation or termination of active flood incidents.
   - Editing municipal depot stockpiles or resource baseline allocations.
   - Ingesting / uploading raw satellite GeoTIFFs or spatial vector boundaries.
   - Deleting disaster historical records or audit logs.
"""
from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.config import settings


async def require_admin_access(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """Security dependency for future mutating administrative operations.
    
    Validates administrative bearer token or X-Admin-Token against configured ADMIN_API_KEY.
    """
    if not settings.ADMIN_API_KEY:
        # If no admin key is configured in development, raise 501 or require configuration
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrative operations are disabled: ADMIN_API_KEY is not configured.",
            )
        return True

    # Check Authorization header (Bearer token) or X-Admin-Token header
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_admin_token:
        token = x_admin_token.strip()

    if not token or token != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid administrative authentication credentials required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return True

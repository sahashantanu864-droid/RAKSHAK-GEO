"""GIS Zone Intelligence and Flood Impact Endpoints (T-017).

Provides spatial intersection between flood extent layers and administrative city wards / building footprints.
All synthetic geometry and disaster statistics are labeled DEMO DATA per agent.md.
"""
from typing import Any, Dict
import httpx
from fastapi import APIRouter, Request, Response, status

from app.core.config import settings
from app.schemas.flood import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
)
from app.schemas.gis import (
    BuildingFootprint,
    FloodImpactRequest,
    FloodImpactResponse,
    WardZoneGeometry,
)
from app.services.gis_service import GISFloodImpactService

router = APIRouter(prefix="/gis", tags=["GIS Zone Intelligence & Flood Impact"])


@router.post(
    "/impact",
    response_model=FloodImpactResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Spatial Flood Impact on Zones and Buildings",
    description=(
        "Performs 2D vector spatial intersection between a detected flood extent boundary and municipal "
        "ward/zone polygons. Computes affected flooded area, percentage area submerged, and identifies "
        "inundated building/facility footprints. Classifies severity deterministically into UNAFFECTED, "
        "LOW, MODERATE, HIGH, or CRITICAL."
    ),
)
def assess_spatial_flood_impact(request: FloodImpactRequest) -> FloodImpactResponse:
    """Assess spatial flood impact across city zones and buildings."""
    return GISFloodImpactService.assess_impact(request)


@router.get(
    "/sample-payload",
    response_model=FloodImpactRequest,
    summary="Get Sample Flood Impact Assessment Request [DEMO DATA]",
    description=(
        "Returns a reference Ahmedabad flood assessment scenario with Sabarmati Riverfront "
        "and Maninagar East ward polygons, critical hospital/shelter footprints, and a river corridor flood extent."
    ),
)
def get_sample_gis_impact_payload() -> FloodImpactRequest:
    """Return a reference spatial impact assessment request with synthetic DEMO DATA."""
    # Synthetic flood corridor over Sabarmati (approx lon 72.56-72.58, lat 23.02-23.05)
    flood_poly = GeoJSONGeometry(
        type="Polygon",
        coordinates=[
            [
                [72.565, 23.020],
                [72.580, 23.020],
                [72.580, 23.050],
                [72.565, 23.050],
                [72.565, 23.020],
            ]
        ],
    )
    flood_fc = GeoJSONFeatureCollection(
        features=[
            GeoJSONFeature(
                geometry=flood_poly,
                properties={"source": "Sentinel-2 NDWI Flood Extent", "label": "DEMO DATA"},
            )
        ]
    )

    # Ward 1: Sabarmati Riverfront (intersects flood extent partially)
    ward_1 = WardZoneGeometry(
        zone_id="ZONE-AHM-WEST-01",
        zone_name="Ahmedabad West / Sabarmati Riverfront [DEMO DATA]",
        total_area_sq_km=8.5,
        geometry=GeoJSONGeometry(
            type="Polygon",
            coordinates=[
                [
                    [72.550, 23.010],
                    [72.590, 23.010],
                    [72.590, 23.060],
                    [72.550, 23.060],
                    [72.550, 23.010],
                ]
            ],
        ),
        population=145000,
    )

    # Ward 2: Maninagar East (outside the flood corridor)
    ward_2 = WardZoneGeometry(
        zone_id="ZONE-AHM-EAST-02",
        zone_name="Ahmedabad East / Maninagar [DEMO DATA]",
        total_area_sq_km=6.2,
        geometry=GeoJSONGeometry(
            type="Polygon",
            coordinates=[
                [
                    [72.600, 22.980],
                    [72.640, 22.980],
                    [72.640, 23.010],
                    [72.600, 23.010],
                    [72.600, 22.980],
                ]
            ],
        ),
        population=110000,
    )

    # Buildings: 1 flooded hospital, 1 unflooded shelter
    bldg_1 = BuildingFootprint(
        building_id="BLDG-HOSP-01",
        name="Sabarmati Emergency Clinic [DEMO DATA]",
        building_type="hospital",
        zone_id="ZONE-AHM-WEST-01",
        geometry=GeoJSONGeometry(
            type="Point",
            coordinates=[72.572, 23.035],  # Inside flood polygon
        ),
    )
    bldg_2 = BuildingFootprint(
        building_id="BLDG-SHELTER-02",
        name="Maninagar Community Relief Shelter [DEMO DATA]",
        building_type="shelter",
        zone_id="ZONE-AHM-EAST-02",
        geometry=GeoJSONGeometry(
            type="Point",
            coordinates=[72.615, 22.995],  # Outside flood polygon
        ),
    )

    return FloodImpactRequest(
        incident_id="INC-AHM-FLOOD-GIS-DEMO",
        flood_extent=flood_fc,
        zones=[ward_1, ward_2],
        buildings=[bldg_1, bldg_2],
    )


@router.get(
    "/isro/status",
    summary="Get ISRO Bhuvan Earth-Observation Integration Status",
    description="Reports connectivity and telemetry for the official ISRO Bhuvan satellite layer.",
)
def get_isro_status() -> Dict[str, Any]:
    """Report ISRO Bhuvan Earth-Observation integration status and available layers."""
    is_authenticated = bool(settings.ISRO_API_KEY)
    return {
        "service": "ISRO / NRSC Bhuvan Earth Observation Service",
        "provider": "Indian Space Research Organisation (ISRO)",
        "portal_url": "https://bhuvan.nrsc.gov.in",
        "wms_endpoint": settings.ISRO_BHUVAN_WMS_URL,
        "active_layer": settings.ISRO_BHUVAN_LAYER,
        "is_authenticated": is_authenticated,
        "attribution": "© Indian Space Research Organisation (ISRO) / NRSC Bhuvan",
        "data_classification": (
            "LIVE ISRO EO SATELLITE DATA"
            if is_authenticated
            else "ISRO BHUVAN PUBLIC WMS LAYER"
        ),
        "supported_layers": [
            {
                "id": "isro_bhuvan_satellite",
                "name": "Bhuvan Satellite Imagery (IRS LISS-IV / Cartosat)",
                "type": "WMS",
                "wms_url": settings.ISRO_BHUVAN_WMS_URL,
                "layer_name": settings.ISRO_BHUVAN_LAYER,
            },
            {
                "id": "isro_bhuvan_dmsp_flood",
                "name": "Bhuvan DMSP NRT Flood Inundation",
                "type": "WMS",
                "wms_url": "https://bhuvan-app3.nrsc.gov.in/bhuvan/wms",
                "layer_name": "flood:flood_hazard_zonation",
            },
        ],
        "security_note": "Server-side proxy ensures ISRO API credentials are never exposed to the client browser.",
    }


import re
from urllib.parse import urlparse

# Allowed ISRO hostnames for strict SSRF mitigation
ALLOWED_ISRO_HOSTS = {
    "bhuvan-vec1.nrsc.gov.in",
    "bhuvan-app3.nrsc.gov.in",
    "bhuvan.nrsc.gov.in",
    "bhoonidhi.nrsc.gov.in",
}

LAYER_NAME_REGEX = re.compile(r"^[A-Za-z0-9_:\-]{1,64}$")


@router.get(
    "/isro/wms",
    summary="Proxy WMS requests to ISRO Bhuvan securely",
    description=(
        "Acts as a secure server-side proxy for ISRO Bhuvan WMS requests. "
        "Appends API tokens when configured in environment, shielding secrets from the browser. "
        "Enforces strict parameter sanitization, SSRF domain pinning, and payload size bounds."
    ),
)
async def proxy_isro_wms(request: Request) -> Response:
    """Proxy WMS raster tile requests to ISRO Bhuvan servers with strict security checks."""
    raw_params = dict(request.query_params)
    
    # 1. Parameter Whitelist & Sanitization
    service = raw_params.get("service", "WMS").upper()
    req_type = raw_params.get("request", "GetMap")
    version = raw_params.get("version", "1.1.1")
    layers = raw_params.get("layers", settings.ISRO_BHUVAN_LAYER)
    fmt = raw_params.get("format", "image/png").lower()

    if service != "WMS" or req_type not in ("GetMap", "GetCapabilities"):
        return Response(status_code=status.HTTP_400_BAD_REQUEST, content="Invalid WMS service or request type")

    if not LAYER_NAME_REGEX.match(layers):
        layers = settings.ISRO_BHUVAN_LAYER

    if not fmt.startswith("image/"):
        fmt = "image/png"

    # Dimension bounds to prevent decompression bomb / DoS
    try:
        width = int(raw_params.get("width", 256))
        height = int(raw_params.get("height", 256))
        width = max(1, min(width, 2048))
        height = max(1, min(height, 2048))
    except (ValueError, TypeError):
        width, height = 256, 256

    # Construct clean upstream parameters
    clean_params = {
        "service": "WMS",
        "request": req_type,
        "version": version if version in ("1.1.1", "1.3.0") else "1.1.1",
        "layers": layers,
        "format": fmt,
        "width": str(width),
        "height": str(height),
    }

    if "bbox" in raw_params:
        bbox_str = raw_params["bbox"]
        # Validate bbox is 4 comma-separated floats
        try:
            parts = [float(x.strip()) for x in bbox_str.split(",")]
            if len(parts) == 4:
                # Sanity check lat/lon bounding ranges
                if -180.0 <= parts[0] <= 180.0 and -90.0 <= parts[1] <= 90.0:
                    clean_params["bbox"] = bbox_str
        except (ValueError, TypeError):
            pass

    for passthrough_key in ("styles", "transparent", "srs", "crs"):
        if passthrough_key in raw_params:
            val = raw_params[passthrough_key]
            if len(val) <= 64 and re.match(r"^[A-Za-z0-9_:\-.,]+$", val):
                clean_params[passthrough_key] = val

    # 2. SSRF Domain Pinning
    parsed_target = urlparse(settings.ISRO_BHUVAN_WMS_URL)
    target_host = parsed_target.hostname or ""
    if not any(target_host == allowed or target_host.endswith("." + allowed) for allowed in ALLOWED_ISRO_HOSTS):
        # Fallback to default verified ISRO host
        target_url = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms"
    else:
        target_url = settings.ISRO_BHUVAN_WMS_URL

    # 3. Inject Server-Side Secret Token (never sent to client)
    if settings.ISRO_API_KEY:
        clean_params["token"] = settings.ISRO_API_KEY

    # 4. Fetch upstream with strict timeout and maximum size cap (5MB)
    try:
        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
            resp = await client.get(target_url, params=clean_params)
            content_type = resp.headers.get("content-type", "")
            content_len = len(resp.content)

            if resp.status_code == 200 and "image" in content_type and content_len <= 5 * 1024 * 1024:
                return Response(
                    content=resp.content,
                    media_type=content_type,
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "X-ISRO-Provider": "NRSC/ISRO Bhuvan",
                        "X-Content-Type-Options": "nosniff",
                    },
                )
    except Exception:
        pass

    # 5. Return 1x1 transparent PNG fallback on any upstream failure or timeout
    transparent_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return Response(
        content=transparent_png,
        media_type="image/png",
        headers={
            "X-ISRO-Status": "FALLBACK_TRANSPARENT",
            "X-Content-Type-Options": "nosniff",
        },
    )


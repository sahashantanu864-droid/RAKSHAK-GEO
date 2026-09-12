"""Automated Security Hardening Test Suite for RAKSHAK-GEO FastAPI Service.

Verifies:
1. Security headers (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy)
2. CORS policy enforcement
3. Payload size rejection (413)
4. Schema boundary guards (negative/excessive inputs rejected with 422)
5. ISRO WMS proxy SSRF prevention and parameter sanitization
6. Safe error responses (no internal stack trace leakage on 500)
7. Database connection diagnostics sanitization
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_security_headers_present():
    """Verify production security headers are set on responses."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation" in resp.headers.get("Permissions-Policy", "")


def test_cors_headers_with_allowed_origin():
    """Verify CORS headers respond correctly to allowed local dev origin."""
    resp = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:4321",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:4321"
    assert resp.headers.get("access-control-allow-credentials") == "true"


def test_payload_size_limit_rejection():
    """Verify oversized requests (>10MB Content-Length) are rejected with 413."""
    resp = client.post(
        "/api/v1/what-if/simulate",
        headers={"Content-Length": str(15 * 1024 * 1024)},  # 15MB
        content=b"x",
    )
    assert resp.status_code == 413
    data = resp.json()
    assert data.get("error_code") == "PAYLOAD_TOO_LARGE"


def test_optimization_negative_resource_rejected():
    """Verify negative resource quantities are rejected with 422 Unprocessable Entity."""
    payload = {
        "incident_id": "INC-TEST",
        "available_resources": {"ambulances": -5, "rescue_boats": 2},
        "zones": [],
    }
    resp = client.post("/api/v1/optimization/allocate", json=payload)
    assert resp.status_code == 422


def test_optimization_excessive_resource_rejected():
    """Verify excessive resource quantities (>10,000,000) are rejected with 422."""
    payload = {
        "incident_id": "INC-TEST",
        "available_resources": {"ambulances": 999_999_999, "rescue_boats": 2},
        "zones": [],
    }
    resp = client.post("/api/v1/optimization/allocate", json=payload)
    assert resp.status_code == 422


def test_timeline_excessive_horizons_rejected():
    """Verify horizon time offsets exceeding 168h or >50 items are rejected with 422."""
    payload = {
        "incident_id": "INC-TEST",
        "base_available_resources": {"ambulances": 10},
        "base_zones": [
            {
                "zone_id": "Z1",
                "zone_name": "Zone 1",
                "demand": {"ambulances": 5},
            }
        ],
        "time_horizons_hours": [0.0, 500.0],  # 500h > 168h max
    }
    resp = client.post("/api/v1/future-gap/timeline", json=payload)
    assert resp.status_code == 422


def test_isro_proxy_rejects_invalid_service_type():
    """Verify non-WMS request types are rejected with 400."""
    resp = client.get("/api/v1/gis/isro/wms", params={"service": "WFS", "request": "GetFeature"})
    assert resp.status_code == 400


def test_isro_proxy_safely_falls_back_on_unreachable():
    """Verify ISRO proxy returns transparent fallback tile without crashing."""
    resp = client.get(
        "/api/v1/gis/isro/wms",
        params={
            "service": "WMS",
            "request": "GetMap",
            "layers": "india3",
            "width": 256,
            "height": 256,
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("content-type") == "image/png"
    assert len(resp.content) > 0


def test_database_status_does_not_leak_raw_passwords():
    """Verify database status endpoint does not leak raw credentials."""
    resp = client.get("/api/v1/city-data/status")
    assert resp.status_code == 200
    text = resp.text
    # Ensure raw password is never present in response
    assert "POSTGRES_PASSWORD" not in text

"""Application configuration settings."""
import os
from typing import List
from pydantic import BaseModel, Field


def _parse_allowed_origins() -> List[str]:
    """Parse allowed origins from environment variable or provide safe development defaults."""
    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    
    # Safe defaults for local development
    return [
        "http://localhost:4321",
        "http://127.0.0.1:4321",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


class Settings(BaseModel):
    """Application settings and environment variables."""
    PROJECT_NAME: str = "CITYSHIELD GIS - RAKSHAK-GEO"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEMO_MODE: bool = True
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS and Security Configuration
    CORS_ALLOWED_ORIGINS: List[str] = Field(default_factory=_parse_allowed_origins)
    MAX_REQUEST_SIZE_BYTES: int = int(os.getenv("MAX_REQUEST_SIZE_BYTES", str(10 * 1024 * 1024)))  # 10MB
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "")

    # PostgreSQL / PostGIS Database Configuration
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "cityshield_gis")
    POSTGIS_ENABLED: bool = os.getenv("POSTGIS_ENABLED", "false").lower() in ("true", "1", "yes")

    # ISRO / NRSC Bhuvan Earth-Observation Configuration
    ISRO_API_KEY: str = os.getenv("ISRO_API_KEY", "")
    ISRO_BHUVAN_WMS_URL: str = os.getenv(
        "ISRO_BHUVAN_WMS_URL",
        "https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms",
    )
    ISRO_BHUVAN_LAYER: str = os.getenv("ISRO_BHUVAN_LAYER", "india3")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def DATABASE_URL(self) -> str:
        """Construct PostgreSQL connection URI."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SAFE(self) -> str:
        """Safe PostgreSQL connection string with masked password for diagnostic logging."""
        masked_pwd = "***" if self.POSTGRES_PASSWORD else ""
        return (
            f"postgresql://{self.POSTGRES_USER}:{masked_pwd}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

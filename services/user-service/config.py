from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # JWT
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(24, alias="JWT_EXPIRATION_HOURS")

    # Service
    service_name: str = Field("user-service", alias="SERVICE_NAME")

    class Config:
        env_file = ".env"


settings = Settings()

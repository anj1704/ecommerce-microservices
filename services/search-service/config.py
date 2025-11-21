from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(..., alias="DATABASE_URL")
    model_name: str = Field(
        "sentence-transformers/all-MiniLM-L6-v2", alias="MODEL_NAME"
    )
    service_name: str = Field("search-service", alias="SERVICE_NAME")

    opensearch_endpoint: str = Field(..., alias="OPENSEARCH_ENDPOINT")
    opensearch_username: str = Field(..., alias="OPENSEARCH_USERNAME")
    opensearch_password: str = Field(..., alias="OPENSEARCH_PASSWORD")

    class Config:
        env_file = ".env"


settings = Settings()

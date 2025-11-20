from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    # database_url: str = "postgresql://dbadmin:localpassword@localhost:5432/ecommerce"
    database_url: str = Field(..., alias="DATABASE_URL")

    # AWS
    aws_region: str = Field("us-east-1", alias="AWS_REGION")
    aws_access_key_id: str | None = Field(None, alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str | None = Field(
        None, alias="AWS_SECRET_ACCESS_KEY")

    # DynamoDB
    dynamodb_endpoint: str | None = Field(None, alias="DYNAMODB_ENDPOINT")
    carts_table: str = Field(..., alias="CARTS_TABLE")
    sessions_table: str = Field(..., alias="SESSIONS_TABLE")

    # Service
    service_name: str = Field("order-service", alias="SERVICE_NAME")

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = False


settings = Settings()

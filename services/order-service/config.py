from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://dbadmin:localpassword@localhost:5432/ecommerce"

    # AWS
    aws_region: str = "us-east-1"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    # DynamoDB
    dynamodb_endpoint: str | None = None  # For local DynamoDB
    carts_table: str = "ecommerce-ms-shopping-carts-dev"
    sessions_table: str = "ecommerce-ms-user-sessions-dev"

    # Service
    service_name: str = "order-service"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields


settings = Settings()

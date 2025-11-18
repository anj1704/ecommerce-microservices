from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://dbadmin:localpassword@localhost:5432/ecommerce"

    # JWT
    jwt_secret: str = "testing-jwt"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # Service
    service_name: str = "user-service"

    class Config:
        env_file = ".env"


settings = Settings()

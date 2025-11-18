from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://dbadmin:localpassword@localhost:5432/ecommerce"
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    service_name: str = "search-service"

    class Config:
        env_file = ".env"


settings = Settings()

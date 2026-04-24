from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "appraisal360-api"
    environment: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:8080"

    jwt_access_secret: str
    jwt_refresh_secret: str
    jwt_access_expires_minutes: int = 15
    jwt_refresh_expires_days: int = 7

    database_url: str

    rustfs_endpoint: str
    rustfs_access_key: str
    rustfs_secret_key: str
    rustfs_region: str = "us-east-1"
    rustfs_bucket_profile_images: str = "profile-images"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    issuer: str
    jwks_url: str
    userinfo_url: str


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

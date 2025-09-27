from functools import lru_cache

from pydantic import BaseSettings


class Settings(BaseSettings):
    app_env: str = "prod"
    rate_limit_window_seconds: int = 60
    disable_rate_limit: bool = False
    frontend_dev_origin: str = "http://localhost:3000"
    frontend_prod_origin: str = "https://rate-my-landlord.vercel.app"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def is_dev(self) -> bool:
        return self.app_env.lower() in {"dev", "development", "local"}

    @property
    def rate_limit_disabled(self) -> bool:
        return self.disable_rate_limit or self.is_dev

    @property
    def allowed_cors_origins(self) -> list[str]:
        if self.is_dev:
            return [self.frontend_dev_origin]
        return [self.frontend_prod_origin]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

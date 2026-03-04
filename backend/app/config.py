from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Originile permise sa acceseze API-ul (separa cu virgula in .env)
    # Exemplu: ALLOWED_ORIGINS=["https://app.vercel.app","http://localhost:3000"]
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    seedream_api_key: str = ""
    seedream_model: str = "doubao-seedream-5-0-260128"
    seedream_api_url: str = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
    depth_model_name: str = "depth-anything/Depth-Anything-V2-Base-hf"
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {"env_file": ".env"}


settings = Settings()

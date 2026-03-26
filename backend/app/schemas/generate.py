from pydantic import BaseModel


class GenerateRequest(BaseModel):
    room_image: str | None = None
    style: str
    furniture: list[str] = []
    furniture_images: list[str] | None = None
    prompt: str | None = None


class GenerateResponse(BaseModel):
    images: list[str]

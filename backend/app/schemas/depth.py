from pydantic import BaseModel


class DepthBase64Request(BaseModel):
    image: str


class DepthResponse(BaseModel):
    depth_map_base64: str
    width: int
    height: int

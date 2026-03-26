from pydantic import BaseModel


class DepthResponse(BaseModel):
    depth_map_base64: str
    width: int
    height: int

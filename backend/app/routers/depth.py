import base64

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas.depth import DepthResponse
from app.services.depth_estimator import estimate_depth

router = APIRouter()


@router.post("/api/depth", response_model=DepthResponse)
async def get_depth(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    try:
        depth_b64, width, height = estimate_depth(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return DepthResponse(depth_map_base64=depth_b64, width=width, height=height)


@router.post("/api/depth/base64", response_model=DepthResponse)
async def get_depth_from_base64(body: dict):
    image_data: str = body.get("image", "")
    if not image_data:
        raise HTTPException(status_code=400, detail="image is required")

    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    try:
        depth_b64, width, height = estimate_depth(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return DepthResponse(depth_map_base64=depth_b64, width=width, height=height)

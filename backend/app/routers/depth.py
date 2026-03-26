import asyncio
import base64

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas.depth import DepthBase64Request, DepthResponse
from app.services.depth_estimator import estimate_depth

router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/api/depth", response_model=DepthResponse)
async def get_depth(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    try:
        depth_b64, width, height = await asyncio.to_thread(estimate_depth, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return DepthResponse(depth_map_base64=depth_b64, width=width, height=height)


@router.post("/api/depth/base64", response_model=DepthResponse)
async def get_depth_from_base64(body: DepthBase64Request):
    image_data = body.image

    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 20MB)")

    try:
        depth_b64, width, height = await asyncio.to_thread(estimate_depth, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return DepthResponse(depth_map_base64=depth_b64, width=width, height=height)

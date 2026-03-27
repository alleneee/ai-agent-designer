import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas.generate import GenerateRequest, GenerateResponse
from app.services.prompt_builder import build_prompt
from app.services.seedream import call_seedream

router = APIRouter()


@router.post("/api/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.style:
        raise HTTPException(status_code=400, detail="style is required")

    reference_images: list[str] = []
    if req.room_image:
        reference_images.append(req.room_image)
    if req.furniture_images:
        reference_images.extend(req.furniture_images)

    prompt = build_prompt(
        style=req.style,
        furniture_descriptions=req.furniture,
        has_room_image=bool(req.room_image),
        furniture_image_count=len(req.furniture_images) if req.furniture_images else 0,
        custom_prompt=req.prompt,
    )

    try:
        images = await asyncio.to_thread(
            call_seedream,
            prompt=prompt,
            images=reference_images if reference_images else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return GenerateResponse(images=images)

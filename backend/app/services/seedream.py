import httpx

from app.config import settings


async def call_seedream(
    prompt: str,
    images: list[str] | None = None,
    size: str = "2K",
    output_format: str = "jpeg",
    n: int = 1,
) -> list[str]:
    body: dict = {
        "model": settings.seedream_model,
        "prompt": prompt,
        "size": size,
        "response_format": "url",
        "output_format": output_format,
        "watermark": False,
        "n": n,
    }
    if images:
        body["image"] = images

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            settings.seedream_api_url,
            json=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.seedream_api_key}",
            },
        )
        resp.raise_for_status()
        data = resp.json()
    result_images = [
        item.get("url") or item.get("b64_json", "")
        for item in data.get("data", [])
    ]
    result_images = [img for img in result_images if img]

    if not result_images:
        raise ValueError("Seedream returned no images")

    return result_images

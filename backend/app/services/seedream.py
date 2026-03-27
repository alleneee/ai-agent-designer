from openai import OpenAI

from app.config import settings

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.seedream_api_key,
            base_url=settings.seedream_base_url,
            timeout=120.0,
        )
    return _client


def call_seedream(
    prompt: str,
    images: list[str] | None = None,
    size: str = "2K",
    output_format: str = "jpeg",
    n: int = 1,
) -> list[str]:
    client = _get_client()

    extra_body: dict = {
        "output_format": output_format,
        "watermark": False,
    }
    if images:
        extra_body["image"] = images

    response = client.images.generate(
        model=settings.seedream_model,
        prompt=prompt,
        size=size,  # type: ignore[arg-type]
        response_format="url",
        n=n,
        extra_body=extra_body,
    )

    result_images = [
        item.url or (item.b64_json or "")
        for item in response.data
    ]
    result_images = [img for img in result_images if img]

    if not result_images:
        raise ValueError("Seedream returned no images")

    return result_images

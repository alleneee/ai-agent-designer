import io
import base64

import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

from app.config import settings

_model = None
_processor = None


def load_model():
    global _model, _processor
    if _model is not None:
        return
    _processor = AutoImageProcessor.from_pretrained(settings.depth_model_name)
    _model = AutoModelForDepthEstimation.from_pretrained(settings.depth_model_name)
    if torch.cuda.is_available():
        _model = _model.to("cuda")
    _model.eval()


def estimate_depth(image_bytes: bytes) -> tuple[str, int, int]:
    load_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = image.size

    inputs = _processor(images=image, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model(**inputs)

    predicted_depth = outputs.predicted_depth

    prediction = torch.nn.functional.interpolate(
        predicted_depth.unsqueeze(1),
        size=(h, w),
        mode="bicubic",
        align_corners=False,
    ).squeeze()

    depth_np = prediction.cpu().numpy()
    depth_min = depth_np.min()
    depth_max = depth_np.max()
    if depth_max - depth_min > 0:
        depth_normalized = (depth_np - depth_min) / (depth_max - depth_min)
    else:
        depth_normalized = np.zeros_like(depth_np)

    depth_uint8 = (depth_normalized * 255).astype(np.uint8)
    depth_image = Image.fromarray(depth_uint8, mode="L")

    buffer = io.BytesIO()
    depth_image.save(buffer, format="PNG")
    depth_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return depth_b64, w, h

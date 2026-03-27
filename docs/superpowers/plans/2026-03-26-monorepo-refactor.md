# Monorepo Refactor + Depth Estimation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Furnish app into a monorepo with a FastAPI Python backend (Seedream API + Depth Anything V2 depth estimation) and a Next.js frontend, enabling 2.5D room visualization from a single photo.

**Architecture:** The project splits into `frontend/` (Next.js, unchanged UI) and `backend/` (FastAPI). The backend handles two responsibilities: (1) Seedream image generation (migrated from Next.js API routes), (2) Depth Anything V2 inference for room depth maps. The frontend replaces its `/api/generate` calls with backend URLs and adds a new depth-based 2.5D room renderer using Three.js displacement mapping. The frontend proxies to the backend via Next.js rewrites to avoid CORS.

**Tech Stack:** Python 3.11+ / FastAPI / uv / torch / transformers (Depth Anything V2) / httpx / Next.js 16 / React Three Fiber / Three.js

---

## File Structure

### New files to create

```
backend/
  pyproject.toml              # uv project config, dependencies
  app/
    __init__.py
    main.py                   # FastAPI app, CORS, lifespan
    config.py                 # Settings via pydantic-settings
    routers/
      __init__.py
      generate.py             # POST /api/generate (Seedream proxy)
      depth.py                # POST /api/depth (DA V2 inference)
    services/
      __init__.py
      seedream.py             # Seedream API client
      prompt_builder.py       # Prompt building logic (port from TS)
      depth_estimator.py      # DA V2 model loading + inference
    schemas/
      __init__.py
      generate.py             # Request/Response models for generate
      depth.py                # Request/Response models for depth
  tests/
    __init__.py
    test_prompt_builder.py    # Port existing tests
    test_generate_router.py   # API tests
    test_depth_router.py      # Depth API tests
  .env                        # Backend env vars
```

### Files to modify

```
frontend/src/app/api/generate/route.ts    # DELETE (replaced by backend)
frontend/src/lib/seedream.ts              # DELETE (moved to backend)
frontend/src/lib/promptBuilder.ts         # DELETE (moved to backend)
frontend/next.config.ts                   # ADD rewrites to proxy /api/* to backend
frontend/src/app/generate/page.tsx        # UPDATE: fetch from /api/generate (same path, proxied)
frontend/src/components/editor/Canvas3D.tsx   # UPDATE: add depth-textured room mesh
frontend/src/components/editor/Room.tsx       # REWRITE: depth displacement room
frontend/src/store/editorStore.ts             # UPDATE: add depthMapUrl + roomImageUrl state
frontend/src/types/index.ts                   # UPDATE: add depth-related types
frontend/src/app/editor/page.tsx              # UPDATE: call depth API on load
```

### Files to move (rename only)

```
src/ -> frontend/src/
package.json -> frontend/package.json
next.config.ts -> frontend/next.config.ts
tsconfig.json -> frontend/tsconfig.json
vitest.config.ts -> frontend/vitest.config.ts
__tests__/ -> frontend/__tests__/
tailwind.config.ts -> frontend/ (if exists)
postcss.config.mjs -> frontend/
public/ -> frontend/public/
.env.local -> backend/.env (Seedream keys move to backend)
```

---

### Task 1: Restructure into monorepo

**Files:**
- Move: all frontend files into `frontend/` subdirectory
- Create: `backend/` directory structure
- Create: root `README.md` update

- [ ] **Step 1: Create the monorepo directory layout**

```bash
cd /Users/niko/furnish
mkdir -p frontend backend
```

- [ ] **Step 2: Move all frontend files into frontend/**

```bash
cd /Users/niko/furnish
# Move source files
mv src frontend/
mv __tests__ frontend/
mv public frontend/
mv package.json frontend/
mv next.config.ts frontend/
mv tsconfig.json frontend/
mv vitest.config.ts frontend/
mv postcss.config.mjs frontend/
mv next-env.d.ts frontend/
mv node_modules frontend/
mv .next frontend/
# Move dot files that belong to frontend
mv eslint.config.mjs frontend/
```

- [ ] **Step 3: Update frontend tsconfig paths**

`frontend/tsconfig.json` - the `@/*` alias still resolves to `./src/*`, which is now `frontend/src/*` relative to the monorepo root. Since Next.js runs from `frontend/`, no change is needed to `tsconfig.json` itself.

Verify:
```bash
cd /Users/niko/furnish/frontend && npx next build 2>&1 | tail -5
```

Expected: successful build (same as before, just from a subdirectory).

- [ ] **Step 4: Commit**

```bash
cd /Users/niko/furnish
git add -A
git commit -m "refactor: move frontend into frontend/ subdirectory for monorepo"
```

---

### Task 2: Initialize Python backend with uv

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/.env`

- [ ] **Step 1: Initialize the uv project**

```bash
cd /Users/niko/furnish/backend
uv init --name furnish-backend --python 3.11
```

- [ ] **Step 2: Write pyproject.toml**

Replace `backend/pyproject.toml` with:

```toml
[project]
name = "furnish-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi[standard]>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "httpx>=0.28.0",
    "pydantic-settings>=2.7.0",
    "python-multipart>=0.0.20",
]

[project.optional-dependencies]
ml = [
    "torch>=2.5.0",
    "transformers>=4.47.0",
    "pillow>=11.0.0",
    "numpy>=2.0.0",
]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/niko/furnish/backend
uv sync
uv sync --extra ml --extra dev
```

- [ ] **Step 4: Create config.py**

`backend/app/config.py`:

```python
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
```

- [ ] **Step 5: Create main.py with health check**

`backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Furnish Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Create .env**

`backend/.env`:

```
SEEDREAM_API_KEY=5fe23897-a89c-4ee4-b51d-b35d3fb36afb
SEEDREAM_MODEL=doubao-seedream-5-0-260128
SEEDREAM_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
DEPTH_MODEL_NAME=depth-anything/Depth-Anything-V2-Base-hf
```

- [ ] **Step 7: Create package directory init files**

```bash
touch backend/app/__init__.py
mkdir -p backend/app/routers backend/app/services backend/app/schemas backend/tests
touch backend/app/routers/__init__.py
touch backend/app/services/__init__.py
touch backend/app/schemas/__init__.py
touch backend/tests/__init__.py
```

- [ ] **Step 8: Verify the server starts**

```bash
cd /Users/niko/furnish/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 2
curl http://localhost:8000/api/health
# Expected: {"status":"ok"}
kill %1
```

- [ ] **Step 9: Commit**

```bash
cd /Users/niko/furnish
git add backend/
git commit -m "feat: initialize FastAPI backend with uv, config, and health check"
```

---

### Task 3: Migrate Seedream API to backend

**Files:**
- Create: `backend/app/schemas/generate.py`
- Create: `backend/app/services/seedream.py`
- Create: `backend/app/services/prompt_builder.py`
- Create: `backend/app/routers/generate.py`
- Modify: `backend/app/main.py` (register router)
- Create: `backend/tests/test_prompt_builder.py`

- [ ] **Step 1: Write the prompt builder tests**

`backend/tests/test_prompt_builder.py`:

```python
from app.services.prompt_builder import build_prompt


def test_room_and_furniture_images():
    result = build_prompt(
        style="北欧",
        furniture_descriptions=["原木茶几"],
        has_room_image=True,
        furniture_image_count=2,
    )
    assert "图1" in result
    assert "图2" in result
    assert "图3" in result
    assert "北欧" in result
    assert "原木茶几" in result
    assert "建筑结构" in result


def test_room_image_only():
    result = build_prompt(
        style="中式",
        furniture_descriptions=["书架"],
        has_room_image=True,
        furniture_image_count=0,
    )
    assert "图1" in result
    assert "中式" in result
    assert "书架" in result


def test_no_images():
    result = build_prompt(
        style="日式",
        furniture_descriptions=[],
        has_room_image=False,
        furniture_image_count=0,
    )
    assert "日式" in result
    assert "室内装修效果图" in result


def test_custom_prompt():
    result = build_prompt(
        style="现代简约",
        furniture_descriptions=[],
        has_room_image=True,
        furniture_image_count=0,
        custom_prompt="增加暖色灯光",
    )
    assert "增加暖色灯光" in result


def test_single_furniture_image():
    result = build_prompt(
        style="北欧",
        furniture_descriptions=[],
        has_room_image=True,
        furniture_image_count=1,
    )
    assert "图2" in result
    assert "图3" not in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/niko/furnish/backend
uv run pytest tests/test_prompt_builder.py -v
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement prompt_builder.py**

`backend/app/services/prompt_builder.py`:

```python
def build_prompt(
    style: str,
    furniture_descriptions: list[str],
    has_room_image: bool,
    furniture_image_count: int,
    custom_prompt: str | None = None,
) -> str:
    parts: list[str] = []

    if has_room_image and furniture_image_count > 0:
        parts.append("基于图1中的真实房间进行室内装修设计")
        parts.append(
            "保持图1中房间的墙壁、地板、天花板、门窗、灯具等建筑结构和空间布局完全不变"
        )
        refs = "、".join(f"图{i + 2}" for i in range(furniture_image_count))
        parts.append(
            f"将{refs}中的家具放入房间中，家具的款式、颜色、材质、造型必须与参考图中一致"
        )
        if furniture_descriptions:
            parts.append(f"同时添加以下家具：{'、'.join(furniture_descriptions)}")
        parts.append(f"整体装修风格为{style}，家具摆放位置合理，空间布局协调")
    elif has_room_image:
        parts.append(f"基于图1中的真实房间进行{style}风格的室内装修设计")
        parts.append("保持图1中房间的墙壁、地板、天花板、门窗等建筑结构完全不变")
        if furniture_descriptions:
            parts.append(f"在房间中添加以下家具：{'、'.join(furniture_descriptions)}")
        else:
            parts.append(f"在房间中添加{style}风格的家具和装饰")
        parts.append("家具摆放位置合理，空间布局协调")
    else:
        parts.append(f"生成一间{style}风格的室内装修效果图")
        if furniture_descriptions:
            parts.append(f"房间中包含以下家具：{'、'.join(furniture_descriptions)}")

    parts.append("专业室内设计效果图，高清写实风格，自然光照，8K质感")

    if custom_prompt:
        parts.append(custom_prompt)

    return "。".join(parts)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/niko/furnish/backend
uv run pytest tests/test_prompt_builder.py -v
```

Expected: 5 passed

- [ ] **Step 5: Implement Seedream service**

`backend/app/services/seedream.py`:

```python
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
```

- [ ] **Step 6: Create schemas**

`backend/app/schemas/generate.py`:

```python
from pydantic import BaseModel


class GenerateRequest(BaseModel):
    room_image: str | None = None
    style: str
    furniture: list[str] = []
    furniture_images: list[str] | None = None
    prompt: str | None = None


class GenerateResponse(BaseModel):
    images: list[str]
```

- [ ] **Step 7: Create generate router**

`backend/app/routers/generate.py`:

```python
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
        images = await call_seedream(
            prompt=prompt,
            images=reference_images if reference_images else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return GenerateResponse(images=images)
```

- [ ] **Step 8: Register router in main.py**

Update `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import generate

app = FastAPI(title="Furnish Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 9: Commit**

```bash
cd /Users/niko/furnish
git add backend/
git commit -m "feat: migrate Seedream API to FastAPI backend with prompt builder"
```

---

### Task 4: Implement Depth Anything V2 service

**Files:**
- Create: `backend/app/services/depth_estimator.py`
- Create: `backend/app/schemas/depth.py`
- Create: `backend/app/routers/depth.py`
- Modify: `backend/app/main.py` (register depth router, add lifespan)
- Create: `backend/tests/test_depth_router.py`

- [ ] **Step 1: Create depth schemas**

`backend/app/schemas/depth.py`:

```python
from pydantic import BaseModel


class DepthResponse(BaseModel):
    depth_map_base64: str
    width: int
    height: int
```

- [ ] **Step 2: Implement depth estimator service**

`backend/app/services/depth_estimator.py`:

```python
import io
import base64
from contextlib import asynccontextmanager

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
```

- [ ] **Step 3: Create depth router**

`backend/app/routers/depth.py`:

```python
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
```

- [ ] **Step 4: Update main.py with lifespan and depth router**

`backend/app/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import generate, depth
from app.services.depth_estimator import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(title="Furnish Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(depth.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Write depth router test**

`backend/tests/test_depth_router.py`:

```python
import io
import base64

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _make_test_image() -> bytes:
    img = Image.new("RGB", (64, 64), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.slow
def test_depth_file_upload():
    image_bytes = _make_test_image()
    resp = client.post(
        "/api/depth",
        files={"file": ("test.png", image_bytes, "image/png")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "depth_map_base64" in data
    assert data["width"] == 64
    assert data["height"] == 64


@pytest.mark.slow
def test_depth_base64():
    image_bytes = _make_test_image()
    b64 = base64.b64encode(image_bytes).decode()
    resp = client.post(
        "/api/depth/base64",
        json={"image": f"data:image/png;base64,{b64}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["width"] == 64
    assert data["height"] == 64
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/niko/furnish/backend
uv run pytest tests/test_prompt_builder.py -v
# Run depth tests (slow, needs model download first time)
uv run pytest tests/test_depth_router.py -v -m "not slow"
# health check only first, then full:
uv run pytest tests/test_depth_router.py::test_health -v
```

Expected: health test passes. Depth tests pass if model is downloaded.

- [ ] **Step 7: Commit**

```bash
cd /Users/niko/furnish
git add backend/
git commit -m "feat: add Depth Anything V2 estimation endpoint"
```

---

### Task 5: Configure frontend to proxy API calls to backend

**Files:**
- Modify: `frontend/next.config.ts`
- Delete: `frontend/src/app/api/generate/route.ts`
- Delete: `frontend/src/lib/seedream.ts`
- Delete: `frontend/src/lib/promptBuilder.ts`
- Modify: `frontend/src/app/generate/page.tsx`
- Delete: `frontend/__tests__/lib/promptBuilder.test.ts` (moved to backend)
- Move: `.env.local` secrets to `backend/.env` (already done in Task 2)

- [ ] **Step 1: Update next.config.ts with rewrites**

`frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Delete backend code from frontend**

```bash
cd /Users/niko/furnish
rm frontend/src/app/api/generate/route.ts
rmdir frontend/src/app/api/generate
rmdir frontend/src/app/api
rm frontend/src/lib/seedream.ts
rm frontend/src/lib/promptBuilder.ts
rm frontend/__tests__/lib/promptBuilder.test.ts
```

- [ ] **Step 3: Update generate page to use snake_case API fields**

In `frontend/src/app/generate/page.tsx`, update the `handleGenerate` function's fetch body. Change the `body: JSON.stringify(...)` section:

Replace:
```typescript
body: JSON.stringify({
  roomImage: roomBase64,
  style: styleName,
  furniture: furnitureDescriptions,
  furnitureImages: furnitureImageBase64.length > 0 ? furnitureImageBase64 : undefined,
  prompt: customPrompt || undefined,
}),
```

With:
```typescript
body: JSON.stringify({
  room_image: roomBase64,
  style: styleName,
  furniture: furnitureDescriptions,
  furniture_images: furnitureImageBase64.length > 0 ? furnitureImageBase64 : undefined,
  prompt: customPrompt || undefined,
}),
```

- [ ] **Step 4: Update GenerateRequest type**

In `frontend/src/types/index.ts`, update the `GenerateRequest` interface field names to match the backend's snake_case:

```typescript
export interface GenerateRequest {
  room_image?: string
  style: string
  furniture: string[]
  furniture_images?: string[]
  prompt?: string
}
```

- [ ] **Step 5: Delete .env.local from frontend root (secrets moved to backend)**

```bash
rm /Users/niko/furnish/.env.local 2>/dev/null || true
rm /Users/niko/furnish/frontend/.env.local 2>/dev/null || true
```

- [ ] **Step 6: Verify frontend build**

```bash
cd /Users/niko/furnish/frontend
npx next build 2>&1 | tail -10
```

Expected: successful build.

- [ ] **Step 7: Integration test**

Start both servers:
```bash
cd /Users/niko/furnish/backend && uv run uvicorn app.main:app --port 8000 &
cd /Users/niko/furnish/frontend && npx next dev --turbopack &
```

Visit `http://localhost:3000`, upload a room image, select style, click generate. The request should proxy through Next.js to FastAPI backend.

- [ ] **Step 8: Commit**

```bash
cd /Users/niko/furnish
git add -A
git commit -m "refactor: proxy frontend API calls to FastAPI backend, remove TS backend code"
```

---

### Task 6: Add depth-based 2.5D room to 3D editor

**Files:**
- Modify: `frontend/src/types/index.ts` (add depth types to Scene)
- Modify: `frontend/src/store/editorStore.ts` (add depth/room image state)
- Rewrite: `frontend/src/components/editor/Room.tsx` (depth displacement mesh)
- Modify: `frontend/src/components/editor/Canvas3D.tsx` (pass depth data to Room)
- Modify: `frontend/src/app/editor/page.tsx` (fetch depth map on load)

- [ ] **Step 1: Update types**

In `frontend/src/types/index.ts`, add to the `Scene` interface:

```typescript
export interface Scene {
  projectId: string
  furniture: FurnitureItem[]
  cameraPosition: [number, number, number]
  depthMapBase64?: string
  roomImageUrl?: string
}
```

- [ ] **Step 2: Update editorStore with depth state**

In `frontend/src/store/editorStore.ts`, add state fields and actions:

Add to `EditorState` interface:
```typescript
depthMapUrl: string | null
roomTextureUrl: string | null
setDepthData: (depthMapBase64: string, roomImageUrl: string) => void
```

Add to the store implementation:
```typescript
depthMapUrl: null,
roomTextureUrl: null,

setDepthData: (depthMapBase64: string, roomImageUrl: string) => {
  const depthMapUrl = `data:image/png;base64,${depthMapBase64}`
  set({ depthMapUrl, roomTextureUrl: roomImageUrl })
},
```

Update `loadScene` to restore depth data from the saved scene:
```typescript
loadScene: async (projectId: string) => {
  const scene = await db.scenes.get(projectId)
  if (scene) {
    set({
      projectId,
      furniture: scene.furniture,
      history: [structuredClone(scene.furniture)],
      historyIndex: 0,
      selectedId: null,
      depthMapUrl: scene.depthMapBase64
        ? `data:image/png;base64,${scene.depthMapBase64}`
        : null,
      roomTextureUrl: scene.roomImageUrl ?? null,
    })
  } else {
    set({
      projectId,
      furniture: [],
      history: [[]],
      historyIndex: 0,
      selectedId: null,
      depthMapUrl: null,
      roomTextureUrl: null,
    })
  }
},
```

Update `saveScene` to persist depth data:
```typescript
saveScene: async () => {
  const { projectId, furniture, depthMapUrl, roomTextureUrl } = get()
  if (!projectId) return
  let depthMapBase64: string | undefined
  if (depthMapUrl?.startsWith('data:image/png;base64,')) {
    depthMapBase64 = depthMapUrl.replace('data:image/png;base64,', '')
  }
  const scene: Scene = {
    projectId,
    furniture: structuredClone(furniture),
    cameraPosition: [5, 5, 5],
    depthMapBase64,
    roomImageUrl: roomTextureUrl ?? undefined,
  }
  await db.scenes.put(scene)
},
```

- [ ] **Step 3: Rewrite Room.tsx with depth displacement**

`frontend/src/components/editor/Room.tsx`:

```tsx
'use client'

import { useTexture } from '@react-three/drei'
import { useEditorStore } from '@/store/editorStore'

export default function Room() {
  const { depthMapUrl, roomTextureUrl } = useEditorStore()

  if (!depthMapUrl || !roomTextureUrl) {
    return <FallbackRoom />
  }

  return <DepthRoom depthMapUrl={depthMapUrl} roomTextureUrl={roomTextureUrl} />
}

function FallbackRoom() {
  const width = 5
  const depth = 4
  const height = 2.8
  const wallThickness = 0.1

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#e8e0d8" />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  )
}

function DepthRoom({
  depthMapUrl,
  roomTextureUrl,
}: {
  depthMapUrl: string
  roomTextureUrl: string
}) {
  const [colorMap, displacementMap] = useTexture([roomTextureUrl, depthMapUrl])

  const planeWidth = 6
  const planeHeight = (colorMap.image.height / colorMap.image.width) * planeWidth
  const segments = 256

  return (
    <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 1.5, 0]} receiveShadow>
      <planeGeometry args={[planeWidth, planeHeight, segments, segments]} />
      <meshStandardMaterial
        map={colorMap}
        displacementMap={displacementMap}
        displacementScale={-2.0}
        side={2}
      />
    </mesh>
  )
}
```

- [ ] **Step 4: Update Canvas3D to adjust camera for depth view**

In `frontend/src/components/editor/Canvas3D.tsx`, update the camera position to better view the depth-displaced room:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Room from './Room'
import FurnitureModel from './FurnitureModel'
import { useEditorStore } from '@/store/editorStore'

export default function Canvas3D() {
  const { furniture, selectedId, selectFurniture, depthMapUrl } = useEditorStore()

  const cameraPos: [number, number, number] = depthMapUrl
    ? [0, 3, 6]
    : [5, 5, 5]

  return (
    <Canvas
      shadows
      camera={{ position: cameraPos, fov: 50 }}
      onPointerMissed={() => selectFurniture(null)}
      className="bg-gray-100"
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Room />

      {furniture.map((item) => (
        <FurnitureModel
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={selectFurniture}
        />
      ))}

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2}
      />

      {!depthMapUrl && (
        <Grid
          infiniteGrid
          fadeDistance={20}
          fadeStrength={5}
          cellSize={0.5}
          sectionSize={1}
        />
      )}
    </Canvas>
  )
}
```

- [ ] **Step 5: Update editor page to fetch depth map**

In `frontend/src/app/editor/page.tsx`, add depth fetching logic inside `EditorContent`. Add after the existing `loadScene` useEffect:

```tsx
useEffect(() => {
  if (!projectId) return
  const fetchDepth = async () => {
    const project = await db.projects.get(projectId)
    if (!project?.roomImage) return

    const { depthMapUrl } = useEditorStore.getState()
    if (depthMapUrl) return

    const roomUrl = URL.createObjectURL(project.roomImage)
    const formData = new FormData()
    formData.append('file', project.roomImage, 'room.jpg')

    try {
      const resp = await fetch('/api/depth', {
        method: 'POST',
        body: formData,
      })
      if (!resp.ok) return
      const data = await resp.json()
      useEditorStore.getState().setDepthData(data.depth_map_base64, roomUrl)
    } catch {
      // depth estimation failed, fallback to basic room
    }
  }
  fetchDepth()
}, [projectId])
```

Add `import { db } from '@/lib/db'` to the imports.

- [ ] **Step 6: Verify frontend build**

```bash
cd /Users/niko/furnish/frontend
npx next build 2>&1 | tail -10
```

Expected: successful build.

- [ ] **Step 7: Commit**

```bash
cd /Users/niko/furnish
git add -A
git commit -m "feat: add depth-based 2.5D room visualization in 3D editor"
```

---

### Task 7: End-to-end integration test and README update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Manual E2E test**

Start both servers:
```bash
# Terminal 1:
cd /Users/niko/furnish/backend && uv run uvicorn app.main:app --port 8000

# Terminal 2:
cd /Users/niko/furnish/frontend && npx next dev --turbopack
```

Test flow:
1. Go to `http://localhost:3000`
2. Upload a room photo
3. Select style, click generate -> should get AI effect image from Seedream via backend
4. Click "进入 3D 编辑" -> should see the room photo as a 2.5D depth-displaced mesh
5. Add furniture from the panel -> should appear in the scene
6. Adjust position/rotation/scale in property panel

- [ ] **Step 2: Update README.md**

`README.md`:

```markdown
# Furnish

AI-powered interior design application. Upload room photos, generate decoration effect images with ByteDance Seedream, and fine-tune furniture layout in a 2.5D editor with depth estimation.

## Architecture

```text
frontend/ (Next.js 16)     backend/ (FastAPI + Python)
  Upload room photo    -->    POST /api/generate (Seedream)
  Enter 3D editor      -->    POST /api/depth (Depth Anything V2)
  3D scene (Three.js)         Returns depth map for 2.5D rendering
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- uv (Python package manager)
- NVIDIA GPU with CUDA (for depth estimation)

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env   # fill in SEEDREAM_API_KEY
uv sync --extra ml
uv run uvicorn app.main:app --port 8000
```

### Frontend

```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # starts on http://localhost:3000
```

The frontend proxies `/api/*` requests to the backend at `localhost:8000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/generate | Generate AI effect images via Seedream |
| POST | /api/depth | Estimate depth map from room photo (file upload) |
| POST | /api/depth/base64 | Estimate depth map from base64 image |

## Tech Stack

- **Frontend:** Next.js 16, React 19, React Three Fiber, Zustand, Dexie.js, Tailwind CSS
- **Backend:** FastAPI, Depth Anything V2, ByteDance Seedream API, httpx
- **3D:** Three.js displacement mapping for 2.5D room visualization
```

- [ ] **Step 3: Run all tests**

```bash
# Backend tests
cd /Users/niko/furnish/backend && uv run pytest -v

# Frontend tests
cd /Users/niko/furnish/frontend && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
cd /Users/niko/furnish
git add -A
git commit -m "docs: update README for monorepo architecture"
```

# Furnish MVP 设计文档

AI 驱动的装修效果预览平台。用户上传房间照片，AI 生成装修效果图，再进入 3D 编辑器微调家具布局。

## 产品定位

- 目标用户：先面向普通消费者（装修业主），后续扩展专业版（设计师/装修公司）
- 核心价值：AI 快速出效果图 + 3D 可编辑，所见即所得
- MVP 策略：Web 优先，验证后扩展移动端

## 核心用户流程

```
上传房间照片/户型图
       |
选择装修风格 + 选择家具
       |
AI 生成 2D 效果图 (Seedream)
       |
浏览多个方案，选中满意的
       |
进入 3D 编辑器，微调家具位置/角度/大小
       |
保存/导出最终方案
```

## 系统架构

```
Frontend (Next.js App Router)
  |-- 上传页面
  |-- AI 效果图预览
  |-- 3D 编辑器 (Three.js)
  |
  | API Routes
  v
Backend (Next.js API Routes)
  |-- AI 生成服务 (代理调用火山引擎 Seedream)
  |
  v
火山引擎 Seedream API
```

存储全部在浏览器本地：localStorage + IndexedDB。

API Routes 只做一件事：代理 Seedream API 调用，避免前端暴露 API Key。

## 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 14+ App Router | SSR + API Routes 全栈 |
| 3D 引擎 | Three.js + React Three Fiber | React 生态集成好，轻量 3D 够用 |
| AI 生图 | 火山引擎 Seedream API | 中文优化好，支持图像编辑和多图参考 |
| 存储 | IndexedDB (Dexie.js) | 无需后端，浏览器本地持久化 |
| 状态管理 | Zustand | 轻量，适合编辑器状态 |
| 样式 | Tailwind CSS | 快速开发 |
| 部署 | Vercel | Next.js 原生支持 |

## 页面设计

### 1. 首页 / 上传页 (`/`)

- 拖拽或点击上传房间照片/户型图
- 上传后图片预览，进入下一步
- 展示已有项目列表（从 IndexedDB 读取）

### 2. AI 效果图生成页 (`/generate`)

- 左侧：上传的房间照片
- 右侧控制面板：
  - 装修风格选择（现代简约、北欧、中式、日式、工业风等预设）
  - 家具素材网格（内置 ~50 件基础家具缩略图，点击选中）
  - prompt 微调输入框（高级用户可自定义描述）
- 底部：点击"生成效果图"，展示 loading 状态
- 生成后展示 1-4 张效果图方案
- "进入 3D 编辑" 按钮

### 3. 3D 编辑器页 (`/editor`)

- 中央：Three.js 3D 视口，简单房间盒子 + 家具模型
- 左侧：家具列表面板，拖拽添加到场景
- 右侧：选中家具的属性面板（位置、旋转、缩放）
- 底部工具栏：视角切换（俯视/正视/自由）、撤销/重做、导出截图
- 交互：鼠标拖拽移动家具、滚轮缩放视角、右键旋转视角

## AI 生成服务

### API Route: `/api/generate`

请求：

```json
{
  "roomImage": "base64...",
  "style": "北欧",
  "furniture": ["灰色布艺三人沙发", "原木茶几"],
  "prompt": "可选的自定义描述"
}
```

响应：

```json
{
  "images": ["base64_or_url_1", "base64_or_url_2", "..."]
}
```

### Prompt 组装策略

- 基础模板：`"将这个房间装修为{style}风格，放入{furniture_list}，保持房间结构不变，真实感室内摄影效果"`
- 每件内置家具对应一段中文描述词
- 用户自定义 prompt 追加在末尾

### Seedream 调用参数

- `images`: 用户上传的房间照片（base64）
- `prompt`: 组装后的描述
- `size`: `2K`
- `max_images`: 4
- `watermark`: false

### 错误处理

- API 超时：前端展示重试按钮
- 余额不足：提示用户
- 图片过大：前端压缩到 2048px 再上传

## 3D 编辑器

### 场景构建

- 房间：Box 几何体（地板 + 四面墙），白色/浅灰材质
- MVP 固定房间尺寸 4m x 5m x 2.8m
- 后续迭代支持用户输入实际尺寸

### 家具模型

- 格式：glTF/GLB
- MVP 内置 ~50 个基础模型，按分类组织：
  - 客厅：沙发、茶几、电视柜、落地灯
  - 卧室：床、床头柜、衣柜、书桌
  - 餐厅：餐桌、餐椅
  - 其他：盆栽、地毯、书架
- 模型来源：开源 3D 素材（Sketchfab CC0 / Poly Pizza）
- 打包到 `public/models/` 目录，按需加载

### 交互

- 拖拽添加：从左侧面板拖拽家具到 3D 视口
- 选中编辑：点击家具高亮选中，出现 TransformControls
- 视角控制：OrbitControls（左键旋转、右键平移、滚轮缩放）
- 快捷操作：Delete 删除、Ctrl+Z 撤销、Ctrl+Shift+Z 重做

### 状态管理

- Zustand 管理编辑器状态（家具列表、选中项、操作历史）
- 每次操作自动存入 IndexedDB

### 导出

- 截图导出：Three.js renderer 导出当前视角为 PNG

## 数据模型

```typescript
interface Project {
  id: string
  name: string
  roomImage: Blob
  style: string
  createdAt: number
  updatedAt: number
}

interface GeneratedImage {
  id: string
  projectId: string
  imageData: Blob
  prompt: string
  selected: boolean
  createdAt: number
}

interface Scene {
  projectId: string
  furniture: FurnitureItem[]
  cameraPosition: [number, number, number]
}

interface FurnitureItem {
  id: string
  modelId: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}
```

存储策略：Dexie.js 操作 IndexedDB，图片和结构化数据都存 IndexedDB。

## 目录结构

```
furnish/
├── public/
│   └── models/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── generate/page.tsx
│   │   ├── editor/page.tsx
│   │   ├── api/generate/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── upload/ImageUploader.tsx
│   │   ├── generate/
│   │   │   ├── StyleSelector.tsx
│   │   │   ├── FurniturePicker.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   └── ResultGallery.tsx
│   │   └── editor/
│   │       ├── Canvas3D.tsx
│   │       ├── FurniturePanel.tsx
│   │       ├── PropertyPanel.tsx
│   │       └── Toolbar.tsx
│   ├── store/
│   │   ├── projectStore.ts
│   │   └── editorStore.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── seedream.ts
│   │   ├── promptBuilder.ts
│   │   └── imageUtils.ts
│   ├── data/furniture.ts
│   └── types/index.ts
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## 依赖清单

| 包 | 用途 |
|---|------|
| next | 框架 |
| react, react-dom | UI |
| three | 3D 引擎 |
| @react-three/fiber | Three.js React 绑定 |
| @react-three/drei | 常用 3D 组件 |
| zustand | 状态管理 |
| dexie | IndexedDB 封装 |
| tailwindcss | 样式 |
| uuid | ID 生成 |

## MVP 里程碑

### M1: 上传 + AI 生图

- 用户可上传房间照片
- 选择装修风格
- 调用 Seedream 生成 1-4 张效果图
- 效果图展示，可查看大图
- 验收：上传空房间照片，选"北欧风"，生成合理效果图

### M2: 3D 编辑器

- 默认房间场景加载
- 左侧面板展示内置家具列表
- 拖拽家具到场景中
- 选中家具可移动/旋转/缩放
- 视角自由旋转缩放
- 导出截图
- 验收：能在 3D 房间里摆放家具并导出截图

### M3: 串联 + 本地持久化

- 首页展示项目列表
- AI 效果图 -> 3D 编辑器串通
- 数据存 IndexedDB，刷新不丢失
- 撤销/重做
- 验收：完整走通 上传->生图->3D编辑->保存->重新打开 的流程

## 明确排除（MVP 不做）

- 用户注册/登录
- 数据库/OSS
- 移动端适配
- 用户上传自定义家具
- 电商对接
- 精确尺寸/材质渲染
- 多人协作

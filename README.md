# Furnish

AI 驱动的装修效果预览平台。上传房间照片，AI 生成装修效果图，3D 编辑器微调家具布局。

## 功能

- 上传房间照片/户型图
- 选择装修风格和家具，AI 生成效果图（Seedream）
- 3D 编辑器拖拽摆放家具
- 深度图驱动的 2.5D 房间可视化
- 撤销/重做操作
- 导出截图
- 数据本地持久化（IndexedDB）

## 技术栈

### 前端

- Next.js 16 (App Router)
- React Three Fiber + drei
- Zustand
- Dexie.js (IndexedDB)
- Tailwind CSS

### 后端

- Python + FastAPI
- Depth Anything V2 (单目深度估计)
- uv (依赖管理)

## 开始使用

### 安装依赖

```bash
cd frontend
npm install
```

### 配置环境变量

复制 `backend/.env.example` 为 `backend/.env`，填入火山引擎 Seedream API 密钥：

```text
SEEDREAM_API_KEY=your_api_key
SEEDREAM_MODEL=doubao-seedream-5-0-260128
SEEDREAM_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
DEPTH_MODEL_NAME=depth-anything/Depth-Anything-V2-Base-hf
```

### 启动后端

```bash
cd backend
uv sync --extra ml --extra dev
uv run uvicorn app.main:app --reload --port 8000
```

### 启动前端

```bash
cd frontend
npm run dev
```

访问 <http://localhost:3000>，前端自动代理 `/api/*` 到后端 `localhost:8000`。

### 运行测试

```bash
# 前端测试
cd frontend && npm test

# 后端测试
cd backend && uv run pytest -v
```

## 项目结构

```text
furnish/
  frontend/         Next.js 前端
    src/
      app/            页面和 API 路由
      components/     UI 组件
      store/          Zustand 状态管理
      lib/            工具函数和服务
      data/           静态数据（家具目录）
      types/          TypeScript 类型定义
    __tests__/        测试文件
  backend/            Python FastAPI 后端
    app/              API 路由和服务
    models/           Depth Anything V2 模型权重
```

## 开发路线

- [x] M1: 上传 + AI 效果图生成
- [x] M2: 3D 编辑器
- [x] M3: 串联 + 本地持久化
- [x] M4: 深度估计 + 2.5D 房间可视化
- [ ] 用户上传自定义家具
- [ ] 精确房间尺寸输入
- [ ] 真实材质渲染
- [ ] 电商对接
- [ ] 移动端适配

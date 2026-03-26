# Furnish

AI 驱动的装修效果预览平台。上传房间照片，AI 生成装修效果图，3D 编辑器微调家具布局。

## 功能

- 上传房间照片/户型图
- 选择装修风格和家具，AI 生成效果图（Seedream）
- 3D 编辑器拖拽摆放家具
- 撤销/重做操作
- 导出截图
- 数据本地持久化（IndexedDB）

## 技术栈

- Next.js 14+ (App Router)
- React Three Fiber + drei
- Zustand
- Dexie.js (IndexedDB)
- Tailwind CSS

## 开始使用

### 安装依赖

```bash
cd frontend
npm install
```

### 配置环境变量

复制 `frontend/.env.local.example` 为 `frontend/.env.local`，填入火山引擎 Seedream API 密钥：

```text
SEEDREAM_API_KEY=your_api_key
SEEDREAM_API_URL=https://visual.volcengineapi.com/v1/images/generations
```

### 启动开发服务器

```bash
cd frontend
npm run dev
```

访问 <http://localhost:3000>

### 运行测试

```bash
cd frontend
npm test
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
  backend/            Python FastAPI 后端（待开发）
```

## 开发路线

- [x] M1: 上传 + AI 效果图生成
- [x] M2: 3D 编辑器
- [x] M3: 串联 + 本地持久化
- [ ] 用户上传自定义家具
- [ ] 精确房间尺寸输入
- [ ] 真实材质渲染
- [ ] 电商对接
- [ ] 移动端适配

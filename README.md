# Furnish

AI 驱动的装修效果预览平台。上传房间照片，AI 生成装修效果图。

## 功能

- 上传房间照片
- 选择装修风格和家具，AI 生成效果图（Seedream）
- 上传参考家具图片，AI 匹配生成
- 自定义 prompt 微调生成结果
- 数据本地持久化（IndexedDB）

## 技术栈

- Next.js 16 (App Router)
- React 19
- Zustand（状态管理）
- Dexie.js（IndexedDB）
- Tailwind CSS 4
- Seedream API（火山引擎，图像生成）

## 开始使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local`，填入火山引擎 Seedream API 密钥：

```text
SEEDREAM_API_KEY=your_api_key
SEEDREAM_MODEL=doubao-seedream-5-0-260128
SEEDREAM_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

### 启动开发服务器

```bash
npm run dev
```

访问 <http://localhost:3000>。

### 运行测试

```bash
npm test
```

## 项目结构

```text
furnish/
  src/
    app/              页面和 API 路由
      api/generate/   Seedream 图像生成 API
      generate/       效果图生成页
    components/       UI 组件
      generate/       生成页组件（风格选择、家具选择等）
      upload/         图片上传组件
    data/             静态数据（家具目录、风格列表）
    lib/              工具函数（数据库、图片处理）
    store/            Zustand 状态管理
    types/            TypeScript 类型定义
  __tests__/          测试文件
  public/             静态资源
```

## 开发路线

- [x] 上传 + AI 效果图生成
- [x] 风格选择 + 家具选择
- [x] 参考家具图片上传
- [x] 本地持久化
- [ ] 用户上传自定义家具
- [ ] 精确房间尺寸输入
- [ ] 真实材质渲染
- [ ] 电商对接
- [ ] 移动端适配

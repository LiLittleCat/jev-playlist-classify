# SONGTYPE

使用 TypeSafe AI 最新的 `jev-latest` 模型，按歌曲主要演唱语言批量整理歌单。

## 功能

- 粘贴多行歌单，格式为 `歌名 - 歌手`
- 自动分批处理大型歌单，没有固定歌曲数量上限
- 每批 100 首，最多 4 批并发，并按原始顺序合并结果
- 使用 8 个独立列表输出：
  - 中文
  - 英文
  - 日语
  - 韩语
  - 西班牙语
  - 法语
  - 其他语言
  - 待确认
- 每个分类结果可一键复制为多行文本
- API Key 只保留在当前页面内存，通过同源服务端转发给 TypeSafe
- 开发环境由 Vite 内置 API 中间件处理请求，不需要单独启动后端端口

## 技术栈

- Vite
- React 19
- TypeScript
- Tailwind CSS 4
- Hono
- TypeSafe AI JavaScript SDK

## 本地开发

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开终端中 Vite 输出的本地地址，在页面中填写 TypeSafe API Key。

## 生产运行

```bash
npm run build
npm start
```

默认监听 `http://127.0.0.1:8787`。可以通过 `PORT` 环境变量指定端口：

```bash
PORT=3000 npm start
```

## 输入格式

每行一首歌曲，以带空格的连字符、短破折号或长破折号分隔歌名和歌手：

```text
晴天 - 周杰伦
红豆 - 王菲

Blinding Lights - The Weeknd
Hello - Adele

Lemon - 米津玄師
夜に駆ける - YOASOBI

좋은 날 - IU
사랑을 했다 - iKON

Despacito - Luis Fonsi
Bailando - Enrique Iglesias

La vie en rose - Édith Piaf
Dernière danse - Indila

Volare - Domenico Modugno
99 Luftballons - Nena
```

如果一行包含多个分隔符，使用最后一个分隔符拆分歌名和歌手。

## 大型歌单

服务端会将歌单拆成每批 100 首，并使用最多 4 个并发请求调用 Jev。应用本身不设置歌曲数量上限，但实际规模仍受浏览器内存、服务器资源、请求耗时和 TypeSafe 账户速率额度影响。

## API Key 安全

- 不要把 API Key 写入代码、提交到 Git 或粘贴到公开 Issue。
- 页面不会把 Key 写入 localStorage；刷新页面后即清除。
- 生产部署必须使用 HTTPS，避免 Key 在传输过程中泄露。
- 如果 Key 曾公开，应立即在 TypeSafe 控制台吊销并重新生成。

## 可用命令

```bash
npm run dev      # 启动 Vite 开发服务器和内置分类 API
npm run build    # 类型检查并构建生产资源
npm start        # 启动生产服务器
npm run preview  # 启动生产服务器
```

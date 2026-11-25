# Mio水汪汪服务迁移表

当前部署候选保持上游接口和认证方式。应用已保存的地址优先。部署默认值在 `service-config.js` 的 `contentParserBase`、`workRepositoryBase` 和 `qqMusicBase` 中调整，QQ 音乐默认空值。AI 和 Companion 地址继续从应用原有设置读取。

| 服务 | 当前入口和优先级 | 协议与认证 | 迁移时核对 |
| --- | --- | --- | --- |
| AI 聊天 | 用户设置与原有角色、API 预设优先。默认 `https://api.openai.com/v1`，Key 留空 | OpenAI 兼容 `POST /chat/completions`，可流式。模型列表 `GET /models`，Bearer Key | 更改应用 API 设置，核对模型名、流式 SSE、浏览器 CORS。沿用原有次级 API、向量与图像设置规则 |
| 抖音和小红书 | 应用 `mcpBase` 优先，默认 `https://mio.xiaoshui.top/api` | 前端调用 `GET /health`、`POST /parse`，JSON `text`，手动解析另传 `platform`，按设置带 `X-Token` | 仓库无解析服务器源码。按客户端实际调用和回包字段对接，确认图片、封面与视频 URL 可用。发布范围不包括自建解析 |
| 作品分享 | 界面保存的仓库服务器优先，默认 `https://repo.xiaoshui.top` | JSON `/api/works`、打包下载 `/api/works/{id}/pack`、举报和点赞，另有 `/api/likes` 与健康检查。设备标识 `X-Device-Id`，删除 `X-Delete-Token`，管理端 `X-Admin-Key` | 运行 `server/repo/server.py`，持久化 `DATA_DIR`；管理密钥留服务端。更换地址不会迁移作者服务器的作品、ID、点赞或删除令牌，需单独导出并核对 |
| QQ 音乐 | 音乐设置内后端地址和访问密钥。保持上游空默认。其他搜索沿用 iTunes 试听 | `/api/music/` 下的 health/status、二维码登录、登出、歌单、搜索、歌词与播放接口。客户端带 `X-Access-Key`，播放使用服务端提供的流地址 | 参考 `docs/music-backend.md`。部署 `server/music/main.py` 和 requirements，限定 `ALLOWED_ORIGINS`，保护 QQ 登录态与 `DATA_DIR` |
| 光遇 Companion | 应用 `skyBase` 与 `skyToken`，原默认留空 | `GET /health`，根路径 `POST /` 发送 JSON-RPC 2.0 `tools/call`，Bearer Token | 保留独立电脑端 Companion。网页需要可连 HTTPS 地址和 CORS；访问令牌仅本地设置 |

浏览器在本地保存角色、聊天与设置，主要使用 IndexedDB 并保留原有 localStorage 兼容路径。天气、字体、试听和可选媒体依赖第三方服务。聊天请求会将模型需要的上下文发给用户配置的模型端点。只有用户主动发起作品分享时，分享内容才上传到配置的仓库服务。解析会向配置的解析端点提交粘贴的链接或文本。测试用新角色和非敏感内容，备份先确认是否含凭据并保存在本地。

迁移音乐或作品仓库时，先准备自有 HTTPS 域名与反向代理，配置浏览器 CORS，服务进程使用持久化目录，密钥和登录状态从服务端配置载入。先比较真实接口的状态与响应字段，再分项切换。解析服务源码未随仓库分发，腾讯云端实现与上游验证需要单独准备。

保持正式 HTTPS origin 不变，只替换后端地址，现有浏览器存储归属不变。若以后更换网页 origin，先在原应用导出备份，并在干净测试环境验证恢复，再迁移真实资料。

# BAND·ON 部署指南（Vercel + Railway，方案 A）

适合：**没有自定义域名**、先用免费子域名内测。

- 前端：`https://你的项目.vercel.app`
- 后端 + 数据库：Railway
- 浏览器只访问 Vercel；`/api/*` 由 Vercel 转发到 Railway（Cookie 登录可用）

---

## 第 0 步：准备

- [ ] 代码已 push 到 GitHub（`main` 分支）
- [ ] 注册 [GitHub](https://github.com)（若还没有）
- [ ] 注册 [Railway](https://railway.com) → **Login with GitHub**
- [ ] 注册 [Vercel](https://vercel.com) → **Continue with GitHub**

---

## 第 1 步：Railway — 创建数据库

1. Railway 控制台 → **New Project**
2. 选 **Provision PostgreSQL**（只建数据库，先不要选 Repo）
3. 点进 Postgres 服务 → **Variables** / **Connect** → 复制 **`DATABASE_URL`**（稍后填到 Backend）

---

## 第 2 步：Railway — 部署后端

1. 同一 Project → **New** → **GitHub Repo** → 选 `band-on` 仓库（GitHub 重命名后；旧名 `bandmate` 会跳转）
2. 新服务出现后在 **Settings**：
   - **Root Directory**：`backend`
   - **Start Command**（若有该字段）：
     ```bash
     npm run start:prod
     ```
3. **Variables** 添加：

   | 变量 | 值 |
   |------|-----|
   | `DATABASE_URL` | 从 Postgres 服务复制（或 `${{Postgres.DATABASE_URL}}` 引用） |
   | `JWT_SECRET` | 随机长字符串（32 位以上，勿用 dev-secret） |
   | `FRONTEND_URL` | 先填 `https://placeholder.vercel.app`，**第 4 步**再改成真实 Vercel 地址 |
   | `PORT` | Railway 通常自动注入，可不填 |

   可选（AI 推荐语）：

   | 变量 | 值 |
   |------|-----|
   | `LLM_API_KEY` | 智谱等 API Key |
   | `LLM_MODEL` | 如 `glm-4-flash` |
   | `LLM_BASE_URL` | 如 `https://open.bigmodel.cn/api/paas/v4` |

4. **Settings → Networking → Generate Domain**，得到公网地址，例如：
   ```text
   https://bandmate-production-xxxx.up.railway.app
   ```
   **复制保存**，后面要填进 `vercel.json`。

5. 等 Deploy 成功（Build 跑 `npm run build`，Start 跑 migrate + server）。

6. 验证：浏览器打开
   ```text
   https://你的-railway域名.up.railway.app/health
   ```
   应看到 `{"ok":true}`。

---

## 第 3 步：改 API 转发地址

编辑仓库 **`frontend/vercel.json`**，把占位符换成第 2 步的 Railway 域名：

```json
"destination": "https://bandmate-production-xxxx.up.railway.app/:path*"
```

保存后 **commit + push**（或稍后在 Vercel 导入前改好）。

---

## 第 4 步：Vercel — 部署前端

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New… → Project**
2. Import GitHub 仓库 `band-on`（或 Settings 里把 Project 显示名改为 **BAND·ON**）
3. **Configure Project**：

   | 项 | 值 |
   |----|-----|
   | Framework Preset | Vite（一般自动识别） |
   | Root Directory | `frontend` |
   | Build Command | `npm run build`（默认即可） |
   | Output Directory | `dist`（默认即可） |

4. **Environment Variables**（Production）：

   | 变量 | 值 |
   |------|-----|
   | `VITE_API_URL` | `/api` |
   | `VITE_APP_URL` | `https://你的项目.vercel.app`（Deploy 后 Vercel 会显示，可先留空 Deploy 一次再补） |

5. **Deploy**

6. 记下 Vercel 给的地址，例如 `https://bandmate-xxx.vercel.app`

---

## 第 5 步：收尾环境变量

1. **Railway Backend** → 把 `FRONTEND_URL` 改成真实 Vercel 地址（含 `https://`，无末尾斜杠）
2. **Vercel** → Settings → Environment Variables → 把 `VITE_APP_URL` 改成同一 Vercel 地址
3. Vercel **Redeploy** 一次（改 env 后需重新 build 前端）

---

## 第 6 步：生产冒烟（约 15 分钟）

在 Vercel 网址上逐项测试：

- [ ] 注册新账号
- [ ] 登录后刷新页面，**仍处于登录状态**（Cookie 正常）
- [ ] 创建乐队 → 复制邀请 → 无痕窗口打开邀请链接 → 加入
- [ ] 完善问卷 → 歌单有推荐
- [ ] 打卡 → 团队面板更新
- [ ] 设置页改昵称 / 切换英文

若「登录后刷新就退出」→ 检查 `VITE_API_URL` 是否为 `/api`，以及 `vercel.json` 里 Railway 地址是否正确。

---

## 常见问题

### 前端能开，但所有 API 失败

- `vercel.json` 的 Railway URL 是否写对
- Railway 后端 `/health` 是否可访问
- Vercel 是否 Redeploy 在改 `vercel.json` 之后

### 邀请链接不对

- `VITE_APP_URL` 必须是 Vercel 公网地址，改完后 **Redeploy 前端**

### 数据库表不存在

- Railway Backend 日志里是否有 `prisma migrate deploy` 成功
- 可手动在 Railway → Backend → **Shell** 运行：`npx prisma migrate deploy`

### 音频上传

- MVP 文件在 Railway 本地盘，**重启可能丢失**；内测可接受，正式运营需对象存储

---

## 以后买域名（可选）

1. 购买域名（`.cn` 约 30 元/年，`.com` 约 80 元/年）
2. Vercel → Project → **Domains** → 添加域名并按提示配 DNS
3. 更新 `FRONTEND_URL`、`VITE_APP_URL` 为新域名
4. 无需改代码逻辑

---

## 本地 vs 生产对照

| | 本地 | 生产（方案 A） |
|--|------|----------------|
| 前端 | `localhost:5173` | `xxx.vercel.app` |
| API | `localhost:3000` | `xxx.vercel.app/api`（转发到 Railway） |
| `VITE_API_URL` | `http://localhost:3000` | `/api` |
| 数据库 | Docker Compose | Railway PostgreSQL |

# BAND·ON Phase 3 — 社区 + 排练计划 设计规格

**日期：** 2026-07-07  
**状态：** 已批准（与 mentor 对齐后的 MVP 范围）  
**前置：** Phase 1（打卡/多乐队）+ Phase 2（歌单推荐）已交付

---

## 1. 目标

在现有 Web App 上增加 **「社区频道」** 与 **「我的」侧的排练计划**，响应 mentor 对双频道、演出通告、乐队征集、练习曲目与计划的建议。

**Phase 3 成功标准（可 demo）：**

1. 导航有 **社区** 入口；用户可发帖、浏览、对帖子「我想参加」。
2. 乐队详情区可创建 **排练计划**（日期 + 备注 + 要练曲目列表）。
3. （可选）社区内有 **器材** UI 壳，展示耗材占位、无支付。

---

## 2. 非目标（Phase 3 不做）

| 不做 | 原因 |
|------|------|
| 歌单投票 / 队内民主定歌 | Mentor 未要求；README 原 Planned 项延后 |
| 真·双 Tab（仅「我的 \| 社区」） | 先保留 乐队/打卡/歌单，加第 4 Tab「社区」 |
| 临时乐队自动匹配算法 | 用社区「征集帖 + 报名」代替 |
| 曲目级熟练度 | 沿用 band member skill 1–5 即可 |
| 电商子系统（支付/订单/库存） | 仅 UI 壳 |
| 视频上传 / AI 剪辑 / 外流平台 | Phase 5 愿景 |
| 评论、点赞、私信 | YAGNI |

---

## 3. 信息架构

### 3.1 导航

```
乐队 | 歌单 | 打卡 | 社区     ← 新增「社区」
```

- **乐队 / 歌单 / 打卡** = mentor 说的「我的频道」能力（不显式改名）。
- **社区** = 演出通告、乐队征集、演出需求、器材入口。

### 3.2 路由

| 路径 | 页面 |
|------|------|
| `/community` | 社区帖列表 |
| `/community/new` | 发帖 |
| `/community/:id` | 帖子详情 + 报名 |
| `/community/gear` | 器材 UI 壳（静态） |
| `/` | 乐队首页（BandSection 内嵌排练计划） |

### 3.3 社区帖类型

| 类型 | 中文 | 典型字段 |
|------|------|----------|
| `ANNOUNCEMENT` | 演出通告 | title, body, eventAt?, location? |
| `RECRUITMENT` | 乐队征集 | title, body, eventAt?, location? |
| `GIG_REQUEST` | 演出需求 | title, body, eventAt?, location?, budgetNote? |

三种类型 **同一套 UI**，发帖时选类型；`GIG_REQUEST` 多一个可选「预算说明」文本字段（不用分货币子系统）。

### 3.4 用户流程

**社区：**

1. 登录用户打开 `/community` → 时间倒序列表。
2. 点「发帖」→ 选类型、填标题/正文/可选时间地点 → 提交。
3. 帖子详情 → 非作者可点「我想参加」（可选留言）；作者可见报名列表。
4. 同一用户对同一帖只能报名一次（409 重复）。

**排练计划：**

1. 在乐队首页某队的 BandSection 内展示「即将排练」计划（最近一条 upcoming）。
2. 任意成员可「新建计划」：日期时间、备注、添加曲目（歌名字符串；可选带 seed `songId`）。
3. 列表可查看该队全部计划（upcoming 优先，past 折叠或分页简化为一页）。

**从推荐加歌（增强，Phase 3 可选）：**

- `/songs` 推荐卡片上「加入排练计划」→ 选目标乐队 → 写入该队最近 upcoming 计划或新建。  
- **若工期紧可 Phase 3.1 再做**；MVP 仅乐队页手动加歌。

---

## 4. 数据模型

### 4.1 Prisma 新增

```prisma
enum CommunityPostType {
  ANNOUNCEMENT
  RECRUITMENT
  GIG_REQUEST
}

model CommunityPost {
  id          String             @id @default(cuid())
  authorId    String             @map("author_id")
  type        CommunityPostType
  title       String
  body        String
  eventAt     DateTime?          @map("event_at")
  location    String?
  budgetNote  String?            @map("budget_note")
  createdAt   DateTime           @default(now()) @map("created_at")
  updatedAt   DateTime           @updatedAt @map("updated_at")

  author    User           @relation(fields: [authorId], references: [id], onDelete: Cascade)
  responses PostResponse[]

  @@map("community_posts")
}

model PostResponse {
  id        String   @id @default(cuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  message   String?
  createdAt DateTime @default(now()) @map("created_at")

  post CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("post_responses")
}

model RehearsalPlan {
  id          String   @id @default(cuid())
  bandId      String   @map("band_id")
  scheduledAt DateTime @map("scheduled_at")
  note        String?
  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")

  band    Band                @relation(fields: [bandId], references: [id], onDelete: Cascade)
  creator User                @relation(fields: [createdById], references: [id], onDelete: Cascade)
  songs   RehearsalPlanSong[]

  @@map("rehearsal_plans")
}

model RehearsalPlanSong {
  id        String  @id @default(cuid())
  planId    String  @map("plan_id")
  songTitle String  @map("song_title")
  songId    String? @map("song_id")
  sortOrder Int     @default(0) @map("sort_order")

  plan RehearsalPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@map("rehearsal_plan_songs")
}
```

`User` / `Band` 增加反向 relation。

### 4.2 权限

| 操作 | 规则 |
|------|------|
| 浏览社区帖 | 登录用户 |
| 发帖 | 登录用户 |
| 删帖 | 作者本人 |
| 报名 | 登录用户，非作者，未重复 |
| 看报名列表 | 帖子作者 |
| 创建/编辑排练计划 | 该乐队成员 |
| 读排练计划 | 该乐队成员 |

---

## 5. API 契约

### 5.1 社区

**`GET /community/posts?type=&limit=50`**

- Auth required  
- Response: `{ posts: CommunityPostSummary[] }`  
- Summary 含：id, type, title, body 前 200 字, eventAt, location, budgetNote, author `{ id, displayName }`, responseCount, createdAt

**`POST /community/posts`**

```json
{
  "type": "RECRUITMENT",
  "title": "周六操场快闪缺鼓手",
  "body": "Lv3+，下午 3 点",
  "eventAt": "2026-07-12T07:00:00.000Z",
  "location": "学校操场",
  "budgetNote": null
}
```

**`GET /community/posts/:id`**

- Response: post + `responses`（仅作者可见完整 responses 含 user displayName；其他用户只见 responseCount + 是否已报名 `hasResponded`）

**`DELETE /community/posts/:id`**

- 作者 only → 204

**`POST /community/posts/:id/responses`**

```json
{ "message": "我可以，有套鼓" }
```

- 409 if already responded

**`DELETE /community/posts/:id/responses/me`**

- 取消自己的报名

### 5.2 排练计划

**`GET /bands/:bandId/rehearsal-plans`**

- Member only  
- Response: `{ plans: RehearsalPlan[] }` 含 songs，按 scheduledAt desc

**`POST /bands/:bandId/rehearsal-plans`**

```json
{
  "scheduledAt": "2026-07-12T14:00:00.000Z",
  "note": "第一次合练",
  "songs": [{ "songTitle": "晴天", "songId": "seed-id-optional" }]
}
```

**`PATCH /bands/:bandId/rehearsal-plans/:planId`**

- 更新 scheduledAt, note, songs（全量替换 songs 列表）

**`DELETE /bands/:bandId/rehearsal-plans/:planId`**

- Member only → 204

---

## 6. 前端组件

| 组件 | 职责 |
|------|------|
| `CommunityFeed.tsx` | 列表 + 类型筛选 chips |
| `CommunityPostCard.tsx` | 列表项 |
| `CommunityPostForm.tsx` | 发帖表单 |
| `CommunityPostDetail.tsx` | 详情 + 报名 |
| `GearShopShell.tsx` | 静态器材 grid |
| `RehearsalPlanPanel.tsx` | BandSection 内计划展示/创建 |
| `api/community.ts` | 社区 API |
| `api/rehearsalPlans.ts` | 计划 API |

i18n：`zh.ts` / `en.ts` 增加 `community.*`、`rehearsalPlan.*`、`nav.community`。

---

## 7. 器材 UI 壳

- 路径：`/community/gear`（从社区页链入）
- 6–8 张静态卡片：弦、拨片、鼓棒、哑鼓垫等
- 价格展示为示意文字；按钮「了解详情」→ `alert` 或 toast「商城筹备中，敬请期待」
- **无 backend**

---

## 8. 测试策略

| 层 | 覆盖 |
|----|------|
| Backend integration | `tests/community.test.ts`：发帖、列表、报名、重复 409、作者看 responses |
| Backend integration | `tests/rehearsalPlans.test.ts`：成员创建计划、非成员 403、songs 写入 |
| Frontend | 手工 demo；不强制 E2E |

---

## 9. 文档与 README

- README Phase roadmap：Phase 3 in progress → done 时更新
- 本 spec + `plans/2026-07-07-phase3-community.md`

---

## 10. 后续 Phase（本文档不实现）

- 真·双 Tab 导航合并
- `/songs`「加入排练计划」
- 临时 band 匹配算法
- 真电商、AI 剪辑

# BAND·ON 演示周 Bugfix 包（范围 A）设计规格

**日期：** 2026-07-15  
**状态：** 已口头批准（用户选 A；C 因工程量大放弃）  
**目标：** 修掉演示中会直接踩到的正确性 / UX 问题；本地提交、不 push。

---

## 1. 目标与非目标

### 目标（必须修）

| # | 问题 | 成功标准 |
|---|------|----------|
| 1 | 邀请码文案写「6 位」，实际 8 位 hex | zh/en placeholder 与文案统一为「8 位」 |
| 2 | 加入失败一律显示「邀请码无效」 | 非码错误走 `getApiErrorMessage`；仅无效码才用无效文案 |
| 3 | 社区 `sort=upcoming` 先按创建时间取一批再内存排序，忙时漏掉远一点的未来帖 | 即将开始的帖按 `eventAt` 正确出现在列表前段，不被截断丢掉 |
| 4 | 排练计划通知 `linkPath` 为 `/`，多乐队时无法定位 | 点击通知切到首页并滚到对应乐队的排练计划区 |
| 5 | 通知 mark-read / Practice 刷新 / 资料问卷失败无反馈 | 失败有可见错误或乐观状态回滚；不吞未处理 rejection |
| 6 | 排练计划编辑提交只传 `songTitle`，会丢掉已有 `songId` | 编辑保存后库中 `songId` 保持原值（若原有） |
| 7 | 社区 feed 快速切筛选有竞态 | 慢请求不会覆盖快请求的最新结果 |

### 非目标（本包不做）

- JWT 强制、uploads 鉴权、CORS 收紧等安全加固（属 B）
- P2 polish：i18n 踢脚字、`confirm`→弹窗、触摸区、顶栏挤、成功条自动消失
- 改通知产品规则（删除不通知、备注-only 不通知保持现状）
- 通知失败事务 / outbox 重构（仅保证「通知失败不颠倒用户可见主流程」若改动触及时再顺手）

---

## 2. 方案选型

采用**定向修补**（不做错误层/通知层大重构）。

| 备选 | 结论 |
|------|------|
| 定向修 1–7 | **采用** — 小、可测、够演示 |
| 顺带重构通知/错误层 | 拒绝 — 易超 scope |
| 只改文案不碰后端 upcoming | 拒绝 — 漏帖仍在 |

---

## 3. 设计

### 3.1 邀请码与加入错误

- **文案：** `band.joinForm.codePlaceholder`（及若有同类「6」文案）改为 8 位（zh/en）。
- **JoinBandForm：** `catch` 使用 `getApiErrorMessage(err, t('band.joinForm.invalidCode'))`，保留 invalid 为 fallback。
- 不改后端码生成逻辑。

### 3.2 社区 upcoming 排序

**问题根因：** `listPosts` 在 `upcoming` 时 `take: limit*3` 且 `orderBy: createdAt desc`，再内存重排。创建很新但活动很远的帖可能挤出窗外；活动近但创建较早的帖可能进不了候选集。

**目标行为：**

- `latest`：保持按 `createdAt DESC`，`take: limit`。
- `upcoming`：优先返回「将来有 `eventAt`」的帖，按 `eventAt ASC`；其后是无日期 / 已过期帖，按 `createdAt DESC`。总数仍 `limit`。

**实现倾向：** 用两条（或带 raw/`$queryRaw`/Prisma 可表达的）查询合并，或等价 SQL；避免「只取最近创建的 N×3」再排序。保留现有 `type` / `mine` 过滤。

**前端：** `CommunityFeed`（及必要的 `CommunityPostDetail`）用 `AbortController` 或递增 `requestId`，忽略过期响应；feed 错误态提供「重试」按钮。

### 3.3 排练通知深链

- **后端：** `notifyBandMates` 的 `linkPath` 改为 `/?bandId=<bandId>#rehearsal-plan`（或等价约定；字段保持字符串）。
- **前端：**
  - `NotificationBell` 仍 `navigate(linkPath)`（已带 query+hash 即可）。
  - `BandHome`（或 `BandSection` / `RehearsalPlanPanel`）：读 `bandId` query；若用户是该成员，把该乐队分区滚入视口（`id`/`ref` + `scrollIntoView`）；可选短暂高亮。
  - 无效 / 非成员 `bandId`：静默落在首页，不报错打断。
- 旧通知若仍为 `/`：行为与今天相同，可接受（不迁移历史行）。

### 3.4 静默失败

| 位置 | 改动 |
|------|------|
| `NotificationBell` | mark-read / mark-all / `loadPanel`：`try/catch`；失败回滚乐观未读数；列表失败显示短错误文案 |
| `Practice.tsx` | `refresh` 等：`catch` + `getApiErrorMessage`（或现有 toast 模式） |
| `BandSection` / `SkillQuestionnaire` | submit：`catch` 并把错误交回问卷 UI 展示 |

不做全局 401 拦截（属 B 边缘，本包不做）。

### 3.5 排练计划编辑保留 `songId`

- 前端编辑草稿：从 `plan.songs` 填入时带上 `songId`（若类型允许）；submit 的 `songs` 数组包含 `songTitle` + 可选 `songId`。
- 后端 update 已按 payload 整表替换歌曲时，写入传来的 `songId`（确认 create/update 类型与 Prisma 字段一致）。
- 测试：创建带 `songId` 的计划 → 仅改时间/备注或改标题外字段 → 再读仍保留原 `songId`（或专门断言 update payload 回传）。

### 3.6 错误与测试

- 后端：`listPosts` upcoming 加回归测试（创建较早但 `eventAt` 近的帖应出现；避免「只靠最近创建」假绿）。
- 后端：排练通知 `linkPath` 含 `bandId`（可挂在现有 rehearsal/notifications 测试）。
- 前端：行为以手测清单为主；邀请码文案 diff 可审。

---

## 4. 本地交付

- 一次或少量 `feat:` / `fix:` 中文 commit；**不 push**。
- 不提交 `.cursor/`、`.vercel/`。

---

## 5. 验收清单（演示向）

1. 加入页 placeholder 显示 8 位；断网或 500 时不误报「邀请码无效」。
2. 造若干「旧帖 + 近未来 eventAt」与「新帖 + 远未来 / 无日期」，`upcoming` 列表近的活动靠前且不被漏掉。
3. 队友收到排练通知 → 点击 → 到达对应乐队排练区块。
4. 编辑已有曲目计划后 `songId` 仍在（若当初有）。
5. 快速连点社区筛选不出现「错的排序结果粘住」。
6. 通知已读接口失败时角标不永久错乱；Practice / 问卷失败有提示。

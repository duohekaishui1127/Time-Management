# 《今天来得及吗？》微信小游戏

一个以安排任务顺序和路线为核心的微信小游戏。现有 40 关：原有校园篇 10 关，以及城市通勤、工作日、周末远行各 10 关。可直接导入微信开发者工具。

## 项目结构

```text
data/levels.js          原有 10 关与关卡索引
data/city-levels.js     城市通勤 10 关
data/work-levels.js     工作日 10 关
data/travel-levels.js   周末远行 10 关
data/level-utils.js     新关卡的数据构造辅助函数
data/chapters.js        章节标题
src/app.js              控制器与界面状态
src/core/              关卡校验、模拟、时间与存档
src/platform/          微信平台能力
src/ui/canvas-ui.js     Canvas 绘制与点击区域
tools/                 关卡穷举验证和回归测试
```

核心模拟不依赖微信 API。`src/app.js` 负责把关卡、进度和界面连接起来；`src/platform/wechat-platform.js` 集中调用 `wx.*`。

## 导入和检查

1. 在微信开发者工具中选择「小游戏」并导入本目录。
2. `project.config.json` 默认使用 `touristappid`，真机或上传前换为自己的小游戏 AppID。
3. 配置激励视频广告位时，修改 `src/config.js` 中的 `rewardedVideoAdUnitId`。
4. 每次改关卡、规则或存档后执行：

```bash
npm run check
```

`npm run check` 会校验关卡数据、穷举每关的任务顺序并确认至少有一个三星解，还会运行存档、单向路线和短屏布局回归测试。GitHub 推送和拉取请求也会执行相同检查。项目没有第三方运行依赖。

## 新增关卡

普通关卡放在相应章节的 `data/*-levels.js`，沿用现有 `level({ ... })` 格式。`route(from, to, minutes)` 默认双向；单行路线用 `route(from, to, minutes, false)`。路线 ID 为 `from_to`，事件修改路线时要引用这个 ID。

新关卡需要填写稳定且唯一的 ID、章节、剧情、起点和截止时间、地点、路线、任务，以及评分数组 `stars: [基准值, 二星门槛, 三星门槛]`。成功至少获得一星。任务可使用 `dependsOn`、`availableAfter`、`finishBefore` 和 `minGapAfter`；使用 `minGapAfter` 时要同时声明对应的 `dependsOn`。事件目前支持模拟开始时修改截止时间、路线耗时或任务耗时。任务最多 6 个，任务列表会根据屏幕高度分页。

将新关卡加入 `data/levels.js` 的关卡索引。新增章节还要在 `data/chapters.js` 登记标题。关卡选择页每页显示 10 关，章节标题取该页第一关的章节。

修改评分或剧情后运行 `npm run check`，再在微信开发者工具和目标真机上检查任务卡片、结果时间线与触摸区域。脚本验证的是数据和规则，不能代替真机体验测试。

## 发布与存档

存档键为 `today_in_time_progress_v2`，启动时会迁移旧键 `today_in_time_progress_v1`，保留解锁、通关和星级数据。关卡 ID 一旦发布应保持不变。加载旧存档时，会根据已通关关卡重新解锁其下一关，因此在已发布内容之间插入关卡也不会让新关卡永久锁住；调整已发布关卡的顺序或评分仍需单独评估玩家进度。

建议每次发布前运行 `npm run check`、固定并验证微信基础库版本，并为发布提交打 Git 标签。当前 `project.config.json` 仍使用 `libVersion: "latest"`，正式发布前应按实测环境固定版本。

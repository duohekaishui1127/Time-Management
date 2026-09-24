# 《今天来得及吗？》微信小游戏 v2

这是上一版微信小游戏工程的工程化优化版，可以直接导入微信开发者工具。

## 这版主要解决什么

上一版能跑，但继续用 Vibe Coding 堆功能会有几个风险：

- `app.js` 同时负责 UI 绘制、状态、交互、广告流程，越来越大。
- 默认解锁数量曾在两个地方重复定义。
- JSON 写错 ID / 地点 / 依赖时，要到运行时才发现。
- 存档结构升级后可能破坏旧玩家进度。
- 星级只有结果，没有评分原因，不方便调关卡。
- 关卡超过 10 个以后选择页没有扩展空间。

v2 针对这些问题做了拆分。

## 目录

```text
data/
  levels.js                 # 10 个关卡数据

src/
  app.js                    # 控制器 / 状态机
  config.js                 # 集中配置

  core/
    game-engine.js          # 时间规划规则
    level-validator.js      # JSON/关卡配置校验
    progression.js          # 解锁/星级/尝试次数/存档迁移
    time.js

  platform/
    wechat-platform.js      # wx.* 全部集中在这里

  ui/
    canvas-ui.js            # Canvas 绘制 + hit area

tools/
  verify-levels.js          # 穷举验证每关三星解
  test-progression.js       # 存档与解锁回归测试
```

## 导入微信开发者工具

1. 解压。
2. 微信开发者工具 -> 小游戏 -> 导入项目。
3. 目录选择本目录。
4. 默认 `touristappid` 可先本地预览。
5. 真机/上传时换成自己的小游戏 AppID。

## 开发阶段建议每次改关卡后跑

```bash
node tools/verify-levels.js
node tools/test-progression.js
```

第一条会检查：

- 关卡 ID、地点 ID、任务 ID、路线 ID 是否重复。
- 任务依赖是否引用了不存在的任务。
- 是否有循环依赖。
- 路线是否引用不存在的地点。
- 关键地点是否从起点可达。
- 时间字段是否合法。
- Event Action 引用是否合法。
- 星级阈值是否合法。
- 每一关是否真的存在三星解。

第二条会检查：

- 默认前 3 关解锁。
- 通关后解锁下一关。
- 最佳星级只升不降。
- 最佳分数只升不降。
- 尝试次数累加。
- 广告提前解锁。
- v1 存档自动迁移到 v2。

## 存档升级

v2 使用：

```text
today_in_time_progress_v2
```

如果发现旧版：

```text
today_in_time_progress_v1
```

会自动迁移：

- unlocked
- completed
- stars -> bestStars

所以后续改存档结构不要直接覆盖老字段。

## 评分现在可解释

结果对象增加：

```js
result.scoreBreakdown
```

示例：

```js
{
  base: 100,
  earlyBonus: 12,
  waitingPenalty: 3,
  latePenalty: 0,
  violationPenalty: 0,
  final: 109
}
```

结果弹层展开后会显示评分来源，更方便你调整三星阈值。

## 新增普通关卡仍然主要改 JSON

仍然坚持：

```text
新关卡
  ↓
data/levels.js
```

不要写：

```js
if (level.id === "college_011") {
  ...
}
```

如果某个机制未来会被很多关使用，再增加通用字段，例如现在已经支持：

```text
availableAfter
finishBefore
dependsOn
minGapAfter
location
simulation_start event
modify_deadline
modify_travel_time
modify_task_duration
```

## 抖音移植

核心层、关卡数据、进度层、UI 绘制都没有直接依赖 `wx`。

以后可增加：

```text
src/platform/douyin-platform.js
```

把微信平台能力适配成 `tt.*`，核心玩法继续复用。

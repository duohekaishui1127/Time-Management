const levelData = require("../data/levels");
const chapterTitles = require("../data/chapters");
const config = require("./config");
const { assertValidLevelData } = require("./core/level-validator");
const { simulateLevel, describeResult, timelineToView } = require("./core/game-engine");
const { Progression } = require("./core/progression");
const { WeChatPlatform } = require("./platform/wechat-platform");
const { CanvasUI } = require("./ui/canvas-ui");

function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

class GameApp {
  constructor() {
    assertValidLevelData(levelData, {
      maxTasksPerLevel: config.gameplay.maxTasksPerLevel,
    });

    this.platform = new WeChatPlatform(config.ads);
    this.levels = levelData.levels;
    this.progress = new Progression(this.platform, this.levels, {
      key: config.storage.key,
      version: config.storage.version,
      legacyKeys: config.storage.legacyKeys,
      defaultUnlockCount: config.gameplay.defaultUnlockCount,
    });

    this.ui = new CanvasUI(this.platform.createCanvas(), this.platform.system);

    this.state = {
      screen: "levels",
      currentLevelIndex: 0,
      selectedIds: [],
      cardOrder: [],
      result: null,
      sheetExpanded: false,
      timelinePage: 0,
      levelPage: 0,
      taskPage: 0,
      busy: false,
    };

    this.platform.enableShare(() => this.getSharePayload());
    this.platform.onTouchStart((event) => this.onTouch(event));
    this.platform.onWindowResize((system) => {
      this.ui.resize(system);
      this.render();
    });
    this.applyLaunchQuery();
    this.render();
    this.warnIfSaveFailed();
  }

  applyLaunchQuery() {
    const query = this.platform.getLaunchQuery();
    if (!query.levelId) return;

    const index = this.levels.findIndex((x) => x.id === query.levelId);
    if (index < 0) return;

    this.state.levelPage = Math.floor(index / config.gameplay.levelPageSize);

    if (this.progress.isUnlocked(query.levelId)) {
      this.openLevel(index);
    } else {
      this.platform.toast("该分享关卡尚未解锁");
    }
  }

  currentLevel() {
    return this.levels[this.state.currentLevelIndex];
  }

  warnIfSaveFailed() {
    if (this.progress.lastSaveSucceeded || this.saveWarningShown) return;
    this.saveWarningShown = true;
    this.platform.toast(this.progress.storageReadOnly
      ? "检测到较新版本存档，当前版本无法保存"
      : "存档暂时不可用，进度可能无法保存");
  }

  render() {
    this.ui.begin();

    if (this.state.screen === "levels") {
      this.ui.renderLevelSelect(this.buildLevelSelectViewModel());
    } else {
      this.ui.renderGame(this.buildGameViewModel());
    }

    if (this.state.result) {
      this.ui.renderResultSheet(this.buildResultViewModel());
    }
  }

  buildLevelSelectViewModel() {
    const pageSize = config.gameplay.levelPageSize;
    const totalPages = Math.ceil(this.levels.length / pageSize);
    const page = Math.max(0, Math.min(this.state.levelPage, totalPages - 1));
    this.state.levelPage = page;

    const start = page * pageSize;
    const pageLevels = this.levels.slice(start, start + pageSize).map((level, localIndex) => {
      const index = start + localIndex;
      return {
        index,
        level,
        unlocked: this.progress.isUnlocked(level.id),
        completed: this.progress.isCompleted(level.id),
        stars: this.progress.getStars(level.id),
        attempts: this.progress.getAttempts(level.id),
      };
    });

    return {
      chapterTitle: chapterTitles[pageLevels[0].level.chapter] || pageLevels[0].level.chapter,
      completedCount: this.levels.filter((level) => this.progress.isCompleted(level.id)).length,
      totalCount: this.levels.length,
      page,
      totalPages,
      levels: pageLevels,
      rewardAvailable: this.platform.canOfferRewardedVideo(),
      saveWarning: !this.progress.lastSaveSucceeded,
    };
  }

  buildGameViewModel() {
    const level = this.currentLevel();
    const goalLocation = level.locations.find((x) => x.id === level.goal.endLocation);

    return {
      chapterTitle: chapterTitles[level.chapter] || level.chapter,
      level,
      levelIndex: this.state.currentLevelIndex,
      selectedIds: this.state.selectedIds,
      cardOrder: this.state.cardOrder,
      taskPage: this.state.taskPage,
      goalLocationName: goalLocation ? goalLocation.name : level.goal.endLocation,
      saveWarning: !this.progress.lastSaveSucceeded,
    };
  }

  buildResultViewModel() {
    const result = this.state.result;
    const nextIndex = this.state.currentLevelIndex + 1;

    return {
      result,
      description: describeResult(this.currentLevel(), result),
      timeline: timelineToView(result.timeline),
      expanded: this.state.sheetExpanded,
      timelinePage: this.state.timelinePage,
      nextText: result.success && nextIndex < this.levels.length ? "下一关 →" : "返回关卡",
    };
  }

  openLevel(index) {
    const level = this.levels[index];
    if (!level || !this.progress.isUnlocked(level.id)) return;

    this.state.screen = "game";
    this.state.currentLevelIndex = index;
    this.state.selectedIds = [];
    this.state.cardOrder = shuffle(level.tasks.map((task) => task.id));
    this.state.taskPage = 0;
    this.state.result = null;
    this.state.sheetExpanded = false;
    this.state.timelinePage = 0;
    this.render();
  }

  resetLevel() {
    const level = this.currentLevel();
    this.state.selectedIds = [];
    this.state.cardOrder = shuffle(level.tasks.map((task) => task.id));
    this.state.taskPage = 0;
    this.state.result = null;
    this.state.sheetExpanded = false;
    this.state.timelinePage = 0;
    this.render();
  }

  runLevel() {
    const result = simulateLevel(this.currentLevel(), this.state.selectedIds);
    this.state.result = result;
    this.state.sheetExpanded = false;
    this.state.timelinePage = 0;
    this.progress.recordAttempt(this.currentLevel().id, result);
    this.warnIfSaveFailed();
    this.platform.haptic();
    this.render();
  }

  async handleLockedLevel(index) {
    if (this.state.busy) return;

    const level = this.levels[index];
    if (!level) return;

    this.state.busy = true;
    try {
      if (!this.platform.canOfferRewardedVideo()) {
        await this.platform.modal({
          title: "第 " + (index + 1) + " 关尚未解锁",
          content: "通关前面的关卡即可免费解锁《" + level.name + "》。",
          showCancel: false,
        });
        return;
      }

      const wantsReward = await this.platform.modal({
        title: "第 " + (index + 1) + " 关尚未解锁",
        content:
          "正常通关前面的关卡即可免费解锁。"
          + "你也可以选择观看一次激励视频，提前解锁《"
          + level.name
          + "》。",
        confirmText: "看广告解锁",
        cancelText: "以后再说",
      });

      if (!wantsReward) return;

      const rewarded = await this.platform.showRewardedVideo();
      if (rewarded) {
        const saved = this.progress.unlockByReward(level.id);
        if (saved) this.platform.toast("已提前解锁");
        else this.warnIfSaveFailed();
      }
    } finally {
      this.state.busy = false;
      this.render();
    }
  }

  getSharePayload() {
    const level = this.currentLevel();
    const isGame = this.state.screen === "game";

    return {
      title: isGame
        ? "这关你能拿三星吗？《" + level.name + "》"
        : "今天来得及吗？我在玩一个时间规划小游戏",
      query: isGame ? "levelId=" + encodeURIComponent(level.id) : "",
    };
  }

  onTouch(event) {
    if (this.state.busy) return;

    const touch =
      (event.touches && event.touches[0])
      || (event.changedTouches && event.changedTouches[0]);

    if (!touch) return;

    const x = Number.isFinite(touch.clientX) ? touch.clientX : touch.x;
    const y = Number.isFinite(touch.clientY) ? touch.clientY : touch.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const hit = this.ui.hitTest(x, y);
    if (hit) this.handleHit(hit);
  }

  handleHit(hit) {
    if (hit.id === "share") {
      this.platform.share(this.getSharePayload());
      return;
    }

    if (this.state.result) {
      this.handleResultHit(hit);
      return;
    }

    if (this.state.screen === "levels") {
      this.handleLevelSelectHit(hit);
      return;
    }

    this.handleGameHit(hit);
  }

  handleResultHit(hit) {
    if (hit.id === "timeline-page-prev") {
      this.state.timelinePage = Math.max(0, this.state.timelinePage - 1);
      this.render();
      return;
    }

    if (hit.id === "timeline-page-next") {
      this.state.timelinePage += 1;
      this.render();
      return;
    }

    if (hit.id === "toggle-detail") {
      this.state.sheetExpanded = !this.state.sheetExpanded;
      this.state.timelinePage = 0;
      this.render();
      return;
    }

    if (hit.id === "retry") {
      this.resetLevel();
      return;
    }

    if (hit.id === "next") {
      const next = this.state.currentLevelIndex + 1;
      if (
        this.state.result.success
        && next < this.levels.length
        && this.progress.isUnlocked(this.levels[next].id)
      ) {
        this.openLevel(next);
      } else {
        this.state.result = null;
        this.state.screen = "levels";
        this.state.levelPage = Math.floor(this.state.currentLevelIndex / config.gameplay.levelPageSize);
        this.render();
      }
    }
  }

  handleLevelSelectHit(hit) {
    if (hit.id === "level") {
      if (hit.data.unlocked) this.openLevel(hit.data.index);
      else this.handleLockedLevel(hit.data.index);
      return;
    }

    if (hit.id === "level-page-prev") {
      this.state.levelPage = Math.max(0, this.state.levelPage - 1);
      this.render();
      return;
    }

    if (hit.id === "level-page-next") {
      this.state.levelPage += 1;
      this.render();
    }
  }

  handleGameHit(hit) {
    if (hit.id === "back") {
      this.state.screen = "levels";
      this.state.levelPage = Math.floor(this.state.currentLevelIndex / config.gameplay.levelPageSize);
      this.render();
      return;
    }

    if (hit.id === "task-page-prev") {
      this.state.taskPage = Math.max(0, this.state.taskPage - 1);
      this.render();
      return;
    }

    if (hit.id === "task-page-next") {
      this.state.taskPage += 1;
      this.render();
      return;
    }

    if (hit.id === "task") {
      if (!this.state.selectedIds.includes(hit.data.id)) {
        this.state.selectedIds.push(hit.data.id);
        this.state.taskPage = 0;
        this.platform.haptic();
        this.render();
      }
      return;
    }

    if (hit.id === "remove-selected") {
      this.state.selectedIds = this.state.selectedIds.filter((id) => id !== hit.data.id);
      this.state.taskPage = 0;
      this.render();
      return;
    }

    if (hit.id === "undo") {
      this.state.selectedIds.pop();
      this.state.taskPage = 0;
      this.render();
      return;
    }

    if (hit.id === "reset") {
      this.resetLevel();
      return;
    }

    if (hit.id === "run") {
      this.runLevel();
    }
  }
}

module.exports = { GameApp };

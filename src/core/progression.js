class Progression {
  constructor(platform, levels, options) {
    this.platform = platform;
    this.levels = levels;
    this.options = options;
    this.state = this._load();
  }

  _defaultState() {
    const unlocked = {};
    this.levels.slice(0, this.options.defaultUnlockCount).forEach((level) => {
      unlocked[level.id] = true;
    });

    return {
      version: this.options.version,
      unlocked,
      completed: {},
      bestStars: {},
      bestScore: {},
      attempts: {},
      rewardUnlocked: {},
    };
  }

  _migrateLegacy(saved) {
    if (!saved || typeof saved !== "object") return null;

    return {
      version: this.options.version,
      unlocked: saved.unlocked || {},
      completed: saved.completed || {},
      bestStars: saved.bestStars || saved.stars || {},
      bestScore: saved.bestScore || {},
      attempts: saved.attempts || {},
      rewardUnlocked: saved.rewardUnlocked || {},
    };
  }

  _load() {
    let state = this.platform.getStorage(this.options.key);

    if (!state) {
      for (const key of this.options.legacyKeys || []) {
        const legacy = this.platform.getStorage(key);
        if (legacy) {
          state = this._migrateLegacy(legacy);
          break;
        }
      }
    }

    if (!state || typeof state !== "object") state = this._defaultState();
    if (state.version !== this.options.version) state = this._migrateLegacy(state) || this._defaultState();

    state.unlocked = state.unlocked || {};
    state.completed = state.completed || {};
    state.bestStars = state.bestStars || {};
    state.bestScore = state.bestScore || {};
    state.attempts = state.attempts || {};
    state.rewardUnlocked = state.rewardUnlocked || {};

    this.levels.slice(0, this.options.defaultUnlockCount).forEach((level) => {
      state.unlocked[level.id] = true;
    });

    // Released levels may be inserted after a level the player already completed.
    this.levels.forEach((level, index) => {
      if (state.completed[level.id] && index + 1 < this.levels.length) {
        state.unlocked[this.levels[index + 1].id] = true;
      }
    });

    this.platform.setStorage(this.options.key, state);
    return state;
  }

  _save() {
    this.platform.setStorage(this.options.key, this.state);
  }

  isUnlocked(levelId) {
    return !!this.state.unlocked[levelId];
  }

  isCompleted(levelId) {
    return !!this.state.completed[levelId];
  }

  getStars(levelId) {
    return this.state.bestStars[levelId] || 0;
  }

  getBestScore(levelId) {
    return this.state.bestScore[levelId] || 0;
  }

  getAttempts(levelId) {
    return this.state.attempts[levelId] || 0;
  }

  recordAttempt(levelId, result) {
    this.state.attempts[levelId] = this.getAttempts(levelId) + 1;
    this.state.bestScore[levelId] = Math.max(this.getBestScore(levelId), result.score || 0);
    this.state.bestStars[levelId] = Math.max(this.getStars(levelId), result.stars || 0);

    if (result.success) {
      this.state.completed[levelId] = true;
      const index = this.levels.findIndex((x) => x.id === levelId);
      if (index >= 0 && index + 1 < this.levels.length) {
        this.state.unlocked[this.levels[index + 1].id] = true;
      }
    }

    this._save();
  }

  unlockByReward(levelId) {
    this.state.unlocked[levelId] = true;
    this.state.rewardUnlocked[levelId] = Date.now();
    this._save();
  }

  resetForDebug() {
    this.state = this._defaultState();
    this._save();
  }
}

module.exports = { Progression };

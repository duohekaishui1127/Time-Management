function recordMap(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function own(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

function nonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

class Progression {
  constructor(platform, levels, options) {
    this.platform = platform;
    this.levels = levels;
    this.options = options;
    this.lastSaveSucceeded = true;
    this.storageReadOnly = false;
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
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;

    return {
      version: this.options.version,
      unlocked: saved.unlocked,
      completed: saved.completed,
      bestStars: saved.bestStars || saved.stars,
      bestScore: saved.bestScore,
      attempts: saved.attempts,
      rewardUnlocked: saved.rewardUnlocked,
    };
  }

  _sanitize(saved) {
    const state = this._defaultState();
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return state;

    const unlocked = recordMap(saved.unlocked);
    const completed = recordMap(saved.completed);
    const bestStars = recordMap(saved.bestStars);
    const bestScore = recordMap(saved.bestScore);
    const attempts = recordMap(saved.attempts);
    const rewardUnlocked = recordMap(saved.rewardUnlocked);

    this.levels.forEach((level) => {
      const id = level.id;
      if (own(unlocked, id) === true) state.unlocked[id] = true;
      if (own(completed, id) === true) {
        state.completed[id] = true;
        state.unlocked[id] = true;
      }
      const stars = own(bestStars, id);
      if (Number.isInteger(stars) && stars >= 1 && stars <= 3) state.bestStars[id] = stars;
      const score = nonNegativeNumber(own(bestScore, id));
      if (score) state.bestScore[id] = score;
      const count = nonNegativeNumber(own(attempts, id));
      if (count) state.attempts[id] = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(count));
      const rewardTime = nonNegativeNumber(own(rewardUnlocked, id));
      if (rewardTime) {
        state.rewardUnlocked[id] = rewardTime;
        state.unlocked[id] = true;
      }
    });

    return state;
  }

  _load() {
    let saved = this.platform.getStorage(this.options.key);

    if (!saved) {
      for (const key of this.options.legacyKeys || []) {
        const legacy = this.platform.getStorage(key);
        if (legacy) {
          saved = this._migrateLegacy(legacy);
          break;
        }
      }
    }

    // A rollback must not replace a save written by a newer game version.
    this.storageReadOnly = !!saved
      && typeof saved === "object"
      && Number.isInteger(saved.version)
      && saved.version > this.options.version;
    const state = this._sanitize(this._migrateLegacy(saved));

    // Released levels may be inserted after a level the player already completed.
    this.levels.forEach((level, index) => {
      if (state.completed[level.id] && index + 1 < this.levels.length) {
        state.unlocked[this.levels[index + 1].id] = true;
      }
    });

    this.lastSaveSucceeded = !this.storageReadOnly
      && this.platform.setStorage(this.options.key, state) !== false;
    return state;
  }

  _save() {
    this.lastSaveSucceeded = !this.storageReadOnly
      && this.platform.setStorage(this.options.key, this.state) !== false;
    return this.lastSaveSucceeded;
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

    return this._save();
  }

  unlockByReward(levelId) {
    this.state.unlocked[levelId] = true;
    this.state.rewardUnlocked[levelId] = Date.now();
    return this._save();
  }

  resetForDebug() {
    this.state = this._defaultState();
    return this._save();
  }
}

module.exports = { Progression };

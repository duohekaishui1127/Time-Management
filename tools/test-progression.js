const assert = require("node:assert");
const levelData = require("../data/levels");
const { Progression } = require("../src/core/progression");

class MemoryPlatform {
  constructor() { this.data = {}; }
  getStorage(key) { return this.data[key] || null; }
  setStorage(key, value) { this.data[key] = JSON.parse(JSON.stringify(value)); }
}

const levels = levelData.levels;
const platform = new MemoryPlatform();

const options = {
  key: "v2",
  version: 2,
  legacyKeys: ["v1"],
  defaultUnlockCount: 3,
};

let progress = new Progression(platform, levels, options);

assert.equal(progress.isUnlocked(levels[0].id), true);
assert.equal(progress.isUnlocked(levels[1].id), true);
assert.equal(progress.isUnlocked(levels[2].id), true);
assert.equal(progress.isUnlocked(levels[3].id), false);

progress.recordAttempt(levels[2].id, { success: true, stars: 2, score: 120 });
assert.equal(progress.isUnlocked(levels[3].id), true);
assert.equal(progress.getStars(levels[2].id), 2);
assert.equal(progress.getBestScore(levels[2].id), 120);
assert.equal(progress.getAttempts(levels[2].id), 1);

progress.recordAttempt(levels[2].id, { success: true, stars: 3, score: 130 });
assert.equal(progress.getStars(levels[2].id), 3);
assert.equal(progress.getBestScore(levels[2].id), 130);
assert.equal(progress.getAttempts(levels[2].id), 2);

progress.unlockByReward(levels[8].id);
assert.equal(progress.isUnlocked(levels[8].id), true);

// Test legacy migration.
const legacyPlatform = new MemoryPlatform();
legacyPlatform.data.v1 = {
  unlocked: { [levels[0].id]: true, [levels[4].id]: true },
  completed: { [levels[0].id]: true },
  stars: { [levels[0].id]: 2 },
};

progress = new Progression(legacyPlatform, levels, options);
assert.equal(progress.getStars(levels[0].id), 2);
assert.equal(progress.isUnlocked(levels[4].id), true);

// A released level inserted after completed content must be available to old saves.
const insertedLevel = { id: "city_inserted" };
const insertedLevels = [...levels.slice(0, 3), insertedLevel, ...levels.slice(3)];
const upgraded = new Progression(platform, insertedLevels, options);
assert.equal(upgraded.isUnlocked(insertedLevel.id), true);

// Malformed save fields must not crash startup or unlock levels accidentally.
const corruptPlatform = new MemoryPlatform();
corruptPlatform.data.v2 = {
  version: 2,
  unlocked: [levels[7].id],
  completed: { [levels[4].id]: true, [levels[5].id]: "true" },
  bestStars: { [levels[4].id]: 99, [levels[5].id]: "3" },
  bestScore: { [levels[4].id]: -12, [levels[6].id]: 123.5 },
  attempts: { [levels[4].id]: Infinity, [levels[6].id]: 4.8 },
  rewardUnlocked: { [levels[8].id]: 12345 },
};
const recovered = new Progression(corruptPlatform, levels, options);
assert.equal(recovered.isUnlocked(levels[7].id), false);
assert.equal(recovered.isUnlocked(levels[4].id), true);
assert.equal(recovered.isUnlocked(levels[5].id), true); // Next after completed level.
assert.equal(recovered.getStars(levels[4].id), 0);
assert.equal(recovered.getStars(levels[5].id), 0);
assert.equal(recovered.getBestScore(levels[4].id), 0);
assert.equal(recovered.getBestScore(levels[6].id), 123.5);
assert.equal(recovered.getAttempts(levels[4].id), 0);
assert.equal(recovered.getAttempts(levels[6].id), 4);
assert.equal(recovered.isUnlocked(levels[8].id), true);

const futurePlatform = new MemoryPlatform();
futurePlatform.data.v2 = {
  version: 3,
  unlocked: { [levels[5].id]: true },
  completed: {},
  bestStars: {},
  bestScore: {},
  attempts: {},
  rewardUnlocked: {},
};
const futureBefore = JSON.stringify(futurePlatform.data.v2);
const downgraded = new Progression(futurePlatform, levels, options);
assert.equal(downgraded.storageReadOnly, true);
assert.equal(downgraded.isUnlocked(levels[5].id), true);
assert.equal(downgraded.recordAttempt(levels[0].id, { success: true, stars: 1, score: 100 }), false);
assert.equal(JSON.stringify(futurePlatform.data.v2), futureBefore);

const failedStorage = new MemoryPlatform();
failedStorage.setStorage = () => false;
const volatileProgress = new Progression(failedStorage, levels, options);
assert.equal(volatileProgress.lastSaveSucceeded, false);
assert.equal(volatileProgress.recordAttempt(levels[0].id, { success: true, stars: 1, score: 100 }), false);

console.log("progression tests: PASS");

const assert = require("node:assert");
const { GameApp } = require("../src/app");

function mockCanvas() {
  const ctx = {};
  for (const name of ["scale", "translate", "clearRect", "fillRect", "beginPath", "moveTo", "arcTo", "closePath", "fill", "stroke", "fillText"]) {
    ctx[name] = () => {};
  }
  ctx.measureText = (value) => ({ width: String(value).length * 7 });
  return { getContext: () => ctx };
}

async function main() {
  const canvas = mockCanvas();
  const storage = {};
  let system = { platform: "android", windowWidth: 320, windowHeight: 568, pixelRatio: 1, safeArea: { top: 44, bottom: 534 } };
  let touchHandler;
  let resizeHandler;
  let lastModal;
  global.wx = {
    getSystemInfoSync: () => system,
    getWindowInfo: () => system,
    createCanvas: () => canvas,
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = JSON.parse(JSON.stringify(value)); },
    onTouchStart: (handler) => { touchHandler = handler; },
    onWindowResize: (handler) => { resizeHandler = handler; },
    showShareMenu: () => {},
    onShareAppMessage: () => {},
    showToast: () => {},
    showModal: (options) => {
      lastModal = options;
      options.success({ confirm: true });
    },
  };

  const app = new GameApp();
  assert.equal(app.state.screen, "levels");
  assert.equal(app.buildLevelSelectViewModel().rewardAvailable, false);
  assert.equal(app.progress.lastSaveSucceeded, true);

  await app.handleLockedLevel(3);
  assert.equal(app.progress.isUnlocked(app.levels[3].id), false);
  assert.equal(lastModal.showCancel, false);
  assert.match(lastModal.content, /通关前面的关卡/);

  const firstCard = app.ui.hitAreas.find((area) => area.id === "level" && area.data.index === 0);
  assert(firstCard);
  touchHandler({ touches: [{ x: firstCard.x + 10, y: app.ui.topInset + (firstCard.y + 10) * app.ui.verticalScale }] });
  assert.equal(app.state.screen, "game");

  const level = app.currentLevel();
  app.state.selectedIds = level.tasks.map((task) => task.id);
  app.runLevel();
  assert.equal(app.progress.getAttempts(level.id), 1);
  assert(app.state.result);
  assert.equal(storage.today_in_time_progress_v2.attempts[level.id], 1);

  system = { platform: "android", windowWidth: 390, windowHeight: 844, pixelRatio: 2, safeArea: { top: 47, bottom: 810 } };
  resizeHandler({ size: { windowWidth: 390, windowHeight: 844 } });
  assert.equal(app.ui.width, 390);
  assert.equal(canvas.width, 780);
  assert.equal(canvas.height, 1688);
  assert(app.ui.hitAreas.some((area) => area.id === "retry"));

  console.log("app smoke test: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

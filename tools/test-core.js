const assert = require("node:assert");
const levelData = require("../data/levels");
const { validateLevelData } = require("../src/core/level-validator");
const { simulateLevel, timelineToView } = require("../src/core/game-engine");
const { CanvasUI } = require("../src/ui/canvas-ui");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

// A legal one-way map can make a particular task order impossible.
const oneWay = clone(levelData.levels[1]);
oneWay.travel.forEach((edge) => { edge.bidirectional = false; });
assert.deepEqual(validateLevelData({ schemaVersion: 1, levels: [oneWay] }).errors, []);
const blocked = simulateLevel(oneWay, ["wash", "coffee_task", "breakfast"]);
assert.equal(blocked.success, false);
assert.match(blocked.violations[0], /无法从/);

const badScore = clone(levelData.levels[0]);
badScore.scoring.earlyBonusPerMinute = "invalid";
assert(validateLevelData({ schemaVersion: 1, levels: [badScore] }).errors.some((x) => x.includes("earlyBonusPerMinute")));
const badEvent = clone(levelData.levels[6]);
badEvent.events[0].actions[0].delta = "invalid";
assert(validateLevelData({ schemaVersion: 1, levels: [badEvent] }).errors.some((x) => x.includes("delta")));

// Every task must remain tappable above the fixed footer on short screens.
function mockCanvas() {
  const ctx = {};
  for (const name of ["scale", "translate", "clearRect", "fillRect", "beginPath", "moveTo", "arcTo", "closePath", "fill", "stroke", "fillText"]) {
    ctx[name] = () => {};
  }
  ctx.measureText = (value) => ({ width: String(value).length * 7 });
  return { getContext: () => ctx };
}

const sixTasks = levelData.levels.find((x) => x.tasks.length === 6);
for (const [width, height] of [[320, 568], [390, 568], [390, 667], [430, 844]]) {
  const ui = new CanvasUI(mockCanvas(), { windowWidth: width, windowHeight: height, pixelRatio: 1 });
  const visible = new Set();
  for (let page = 0; page < 6; page++) {
    ui.begin();
    ui.renderGame({
      level: sixTasks,
      levelIndex: levelData.levels.indexOf(sixTasks),
      chapterTitle: "测试章节",
      selectedIds: [],
      cardOrder: sixTasks.tasks.map((task) => task.id),
      taskPage: page,
      goalLocationName: "终点",
    });
    const cards = ui.hitAreas.filter((area) => area.id === "task");
    cards.forEach((area) => {
      assert(area.y + area.h <= height - 84, "任务卡片被底栏覆盖");
      visible.add(area.data.id);
    });
  }
  assert.equal(visible.size, sixTasks.tasks.length);
}

const levelSelectUI = new CanvasUI(mockCanvas(), { windowWidth: 320, windowHeight: 568, pixelRatio: 1 });
levelSelectUI.begin();
levelSelectUI.renderLevelSelect({
  chapterTitle: "第一章 · 大学生的一天",
  completedCount: 1,
  totalCount: levelData.levels.length,
  page: 0,
  totalPages: 4,
  levels: levelData.levels.slice(0, 10).map((level, index) => ({
    index, level, unlocked: index < 3, completed: index === 0, stars: index === 0 ? 3 : 0, attempts: index === 0 ? 2 : 0,
  })),
});
assert(levelSelectUI.hitAreas.filter((area) => area.id === "level").every((area) => area.y + area.h <= 568 - 58));
assert(levelSelectUI.hitAreas.some((area) => area.id === "level-page-next"));

// Canvas controls stay inside notched-screen safe areas, including after resize.
const safeCanvas = mockCanvas();
const safeUI = new CanvasUI(safeCanvas, {
  windowWidth: 320, windowHeight: 568, pixelRatio: 1,
  safeArea: { top: 44, bottom: 534 },
});
assert.equal(safeUI.height, 568);
assert(safeUI.verticalScale < 1);
safeUI.begin();
safeUI.renderLevelSelect({
  chapterTitle: "测试章节", completedCount: 0, totalCount: levelData.levels.length,
  page: 0, totalPages: 4, rewardAvailable: false,
  levels: levelData.levels.slice(0, 10).map((level, index) => ({
    index, level, unlocked: index < 3, completed: false, stars: 0, attempts: 0,
  })),
});
const safeNext = safeUI.hitAreas.find((area) => area.id === "level-page-next");
assert(safeNext);
assert.equal(safeUI.hitTest(safeNext.x + 10, 44 + (safeNext.y + 10) * safeUI.verticalScale).id, "level-page-next");
assert.equal(safeUI.hitTest(safeNext.x + 10, 10), null);
assert(44 + (safeNext.y + safeNext.h) * safeUI.verticalScale <= 534);
safeUI.resize({
  windowWidth: 390, windowHeight: 844, pixelRatio: 2,
  safeArea: { top: 47, bottom: 810 },
});
assert.equal(safeCanvas.width, 780);
assert.equal(safeCanvas.height, 1688);
assert.equal(safeUI.verticalScale, 1);

const sixTaskOrder = ["deck", "demo", "sample", "passes", "drinks", "screen"];
const sixTaskResult = simulateLevel(sixTasks, sixTaskOrder);
assert(sixTaskResult.timeline.length > 7);
for (const [width, height] of [[320, 568], [390, 568], [390, 667]]) {
  const ui = new CanvasUI(mockCanvas(), { windowWidth: width, windowHeight: height, pixelRatio: 1 });
  const vm = {
    result: sixTaskResult,
    description: "测试结果",
    timeline: timelineToView(sixTaskResult.timeline),
    expanded: true,
    timelinePage: 0,
    nextText: "下一关",
  };
  ui.begin();
  ui.renderGame({
    level: sixTasks,
    levelIndex: levelData.levels.indexOf(sixTasks),
    chapterTitle: "测试章节",
    selectedIds: [],
    cardOrder: sixTasks.tasks.map((task) => task.id),
    taskPage: 0,
    goalLocationName: "终点",
  });
  assert(ui.hitAreas.some((area) => area.id === "task"));
  ui.renderResultSheet(vm);
  assert(!ui.hitAreas.some((area) => area.id === "task"));
  assert(ui.hitAreas.some((area) => area.id === "share" && area.y >= height * 0.16));
  assert(ui.hitAreas.some((area) => area.id === "timeline-page-next"));
  vm.timelinePage = 99;
  ui.begin();
  ui.renderResultSheet(vm);
  assert(ui.hitAreas.some((area) => area.id === "timeline-page-prev"));
  assert(!ui.hitAreas.some((area) => area.id === "timeline-page-next"));
}

console.log("core and UI tests: PASS");

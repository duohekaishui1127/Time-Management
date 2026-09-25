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
  for (const name of ["scale", "clearRect", "fillRect", "beginPath", "moveTo", "arcTo", "closePath", "fill", "stroke", "fillText"]) {
    ctx[name] = () => {};
  }
  ctx.measureText = (value) => ({ width: String(value).length * 7 });
  return { getContext: () => ctx };
}

const sixTasks = levelData.levels.find((x) => x.tasks.length === 6);
for (const height of [568, 667]) {
  const ui = new CanvasUI(mockCanvas(), { windowWidth: 390, windowHeight: height, pixelRatio: 1 });
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

const sixTaskOrder = ["deck", "demo", "sample", "passes", "drinks", "screen"];
const sixTaskResult = simulateLevel(sixTasks, sixTaskOrder);
assert(sixTaskResult.timeline.length > 7);
for (const height of [568, 667]) {
  const ui = new CanvasUI(mockCanvas(), { windowWidth: 390, windowHeight: height, pixelRatio: 1 });
  const vm = {
    result: sixTaskResult,
    description: "测试结果",
    timeline: timelineToView(sixTaskResult.timeline),
    expanded: true,
    timelinePage: 0,
    nextText: "下一关",
  };
  ui.begin();
  ui.renderResultSheet(vm);
  assert(ui.hitAreas.some((area) => area.id === "timeline-page-next"));
  vm.timelinePage = 99;
  ui.begin();
  ui.renderResultSheet(vm);
  assert(ui.hitAreas.some((area) => area.id === "timeline-page-prev"));
  assert(!ui.hitAreas.some((area) => area.id === "timeline-page-next"));
}

console.log("core and UI tests: PASS");

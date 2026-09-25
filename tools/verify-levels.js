const levelData = require("../data/levels");
const config = require("../src/config");
const { assertValidLevelData } = require("../src/core/level-validator");
const { simulateLevel } = require("../src/core/game-engine");
const { formatTime } = require("../src/core/time");

assertValidLevelData(levelData, {
  maxTasksPerLevel: config.gameplay.maxTasksPerLevel,
});

function* permutations(items, start) {
  start = start || 0;
  if (start >= items.length - 1) {
    yield items.slice();
    return;
  }

  for (let i = start; i < items.length; i++) {
    const temp = items[start];
    items[start] = items[i];
    items[i] = temp;

    yield* permutations(items, start + 1);

    items[i] = items[start];
    items[start] = temp;
  }
}

let failed = false;

levelData.levels.forEach((level, index) => {
  let best = null;
  const ids = level.tasks.map((task) => task.id);

  for (const order of permutations(ids.slice())) {
    const result = simulateLevel(level, order);
    if (
      result.success
      && (best === null
        || result.score > best.result.score
        || (result.score === best.result.score && result.arrivalTime < best.result.arrivalTime))
    ) {
      best = { order: order.slice(), result };
    }
  }

  if (!best) {
    failed = true;
    console.error(String(index + 1).padStart(2, "0"), level.name, "| ERROR: 不存在通关顺序");
    return;
  }

  const taskNames = best.order.map((id) => level.tasks.find((task) => task.id === id).name);
  console.log(
    String(index + 1).padStart(2, "0"),
    level.name,
    "| ★" + best.result.stars,
    "| score", best.result.score,
    "| arrive", formatTime(best.result.arrivalTime),
    "|", taskNames.join(" -> ")
  );

  if (best.result.stars < 3) {
    failed = true;
    console.error("  ERROR: 当前关卡不存在三星解");
  }
});

if (failed) process.exitCode = 1;

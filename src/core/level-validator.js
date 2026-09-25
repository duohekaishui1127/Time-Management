const { parseTime } = require("./time");

const SUPPORTED_ACTIONS = new Set([
  "modify_deadline",
  "modify_travel_time",
  "modify_task_duration",
]);

function addError(errors, level, message) {
  errors.push("[" + (level.id || level.name || "unknown") + "] " + message);
}

function assertUnique(items, field, label, level, errors) {
  const seen = new Set();
  (items || []).forEach((item) => {
    const value = item && item[field];
    if (!value) {
      addError(errors, level, label + " 缺少 " + field);
      return;
    }
    if (seen.has(value)) addError(errors, level, label + " ID 重复: " + value);
    seen.add(value);
  });
}

function hasCycle(tasks) {
  const deps = {};
  tasks.forEach((task) => {
    deps[task.id] = task.dependsOn || [];
  });

  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;

    visiting.add(id);
    for (const dep of deps[id] || []) {
      if (visit(dep)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return Object.keys(deps).some(visit);
}

function buildUndirectedGraph(level) {
  const graph = {};
  (level.locations || []).forEach((loc) => { graph[loc.id] = []; });

  (level.travel || []).forEach((edge) => {
    if (graph[edge.from]) graph[edge.from].push(edge.to);
    if (edge.bidirectional !== false && graph[edge.to]) graph[edge.to].push(edge.from);
  });

  return graph;
}

function reachable(graph, start, target) {
  if (start === target) return true;
  const queue = [start];
  const seen = new Set([start]);

  while (queue.length) {
    const current = queue.shift();
    for (const next of graph[current] || []) {
      if (next === target) return true;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

function validateLevelData(levelData, options) {
  const errors = [];
  const warnings = [];
  const maxTasks = (options && options.maxTasksPerLevel) || 6;

  if (!levelData || !Array.isArray(levelData.levels) || levelData.levels.length === 0) {
    return { errors: ["levels 必须是非空数组"], warnings };
  }
  if (levelData.schemaVersion !== 1) errors.push("不支持的关卡 schemaVersion: " + levelData.schemaVersion);

  assertUnique(levelData.levels, "id", "关卡", { id: "root" }, errors);

  levelData.levels.forEach((level) => {
    if (!level.name) addError(errors, level, "缺少关卡名称");
    if (!level.chapter) addError(errors, level, "缺少 chapter");
    if (!level.timeline || !level.timeline.start) addError(errors, level, "缺少 timeline.start");
    if (!level.goal || !level.goal.deadline || !level.goal.endLocation) {
      addError(errors, level, "goal 必须包含 deadline 和 endLocation");
    }

    try {
      const start = parseTime(level.timeline && level.timeline.start);
      const deadline = parseTime(level.goal && level.goal.deadline);
      if (start >= deadline) addError(errors, level, "当前版本不支持跨天关卡，start 必须早于 deadline");
    } catch (error) {
      addError(errors, level, error.message);
    }

    const locations = level.locations || [];
    const tasks = level.tasks || [];
    const travel = level.travel || [];
    const events = level.events || [];

    assertUnique(locations, "id", "地点", level, errors);
    assertUnique(tasks, "id", "任务", level, errors);
    assertUnique(travel, "id", "路线", level, errors);
    assertUnique(events, "id", "事件", level, errors);

    if (tasks.length < 1) addError(errors, level, "至少需要一个任务");
    if (tasks.length > maxTasks) {
      addError(errors, level, "任务数量 " + tasks.length + " 超过当前 UI 上限 " + maxTasks);
    }

    const locationIds = new Set(locations.map((x) => x.id));
    const taskIds = new Set(tasks.map((x) => x.id));
    const travelIds = new Set(travel.map((x) => x.id));

    if (!locationIds.has(level.startLocation)) addError(errors, level, "startLocation 不存在: " + level.startLocation);
    if (level.goal && !locationIds.has(level.goal.endLocation)) {
      addError(errors, level, "goal.endLocation 不存在: " + level.goal.endLocation);
    }

    travel.forEach((edge) => {
      if (!locationIds.has(edge.from)) addError(errors, level, "路线 " + edge.id + " 的 from 不存在: " + edge.from);
      if (!locationIds.has(edge.to)) addError(errors, level, "路线 " + edge.id + " 的 to 不存在: " + edge.to);
      if (!Number.isFinite(edge.duration) || edge.duration < 0) {
        addError(errors, level, "路线 " + edge.id + " duration 必须 >= 0");
      }
    });

    tasks.forEach((task) => {
      if (!locationIds.has(task.location)) addError(errors, level, "任务 " + task.id + " 的 location 不存在: " + task.location);
      if (!Number.isFinite(task.duration) || task.duration <= 0) {
        addError(errors, level, "任务 " + task.id + " duration 必须 > 0");
      }

      (task.dependsOn || []).forEach((depId) => {
        if (!taskIds.has(depId)) addError(errors, level, "任务 " + task.id + " 依赖不存在: " + depId);
        if (depId === task.id) addError(errors, level, "任务 " + task.id + " 不能依赖自身");
      });

      if (task.availableAfter) {
        try { parseTime(task.availableAfter); }
        catch (error) { addError(errors, level, "任务 " + task.id + ": " + error.message); }
      }

      if (task.finishBefore) {
        try { parseTime(task.finishBefore); }
        catch (error) { addError(errors, level, "任务 " + task.id + ": " + error.message); }
      }

      (task.minGapAfter || []).forEach((gap) => {
        if (!taskIds.has(gap.taskId)) addError(errors, level, "任务 " + task.id + " minGapAfter 引用不存在: " + gap.taskId);
        if (!Number.isFinite(gap.minutes) || gap.minutes < 0) addError(errors, level, "任务 " + task.id + " minGapAfter.minutes 非法");
        if (!(task.dependsOn || []).includes(gap.taskId)) {
          addError(errors, level, "任务 " + task.id + " 的 minGapAfter 必须同时声明 dependsOn: " + gap.taskId);
        }
      });
    });

    if (hasCycle(tasks)) addError(errors, level, "任务 dependsOn 存在循环依赖");

    events.forEach((event) => {
      if (!event.trigger || event.trigger.type !== "simulation_start") {
        addError(errors, level, "事件 " + event.id + " 当前只支持 trigger.type=simulation_start");
      }
      (event.actions || []).forEach((action) => {
        if (!SUPPORTED_ACTIONS.has(action.type)) {
          addError(errors, level, "事件 " + event.id + " action 不支持: " + action.type);
          return;
        }
        if (action.type === "modify_travel_time" && !travelIds.has(action.travelId)) {
          addError(errors, level, "事件 " + event.id + " 引用不存在的 travelId: " + action.travelId);
        }
        if (action.type === "modify_task_duration" && !taskIds.has(action.taskId)) {
          addError(errors, level, "事件 " + event.id + " 引用不存在的 taskId: " + action.taskId);
        }
        if (action.type === "modify_travel_time" || action.type === "modify_task_duration") {
          if (!Number.isFinite(action.delta)) addError(errors, level, "事件 " + event.id + " delta 必须是有限数值");
        }
        if (action.type === "modify_deadline") {
          try { parseTime(action.newDeadline); }
          catch (error) { addError(errors, level, "事件 " + event.id + ": " + error.message); }
        }
      });
    });

    const scoring = level.scoring || {};
    for (const key of ["successBase", "failureBase", "earlyBonusPerMinute", "waitingPenaltyPerMinute", "latePenaltyPerMinute", "violationPenalty"]) {
      if (scoring[key] !== undefined && (!Number.isFinite(scoring[key]) || scoring[key] < 0)) {
        addError(errors, level, "scoring." + key + " 必须是非负有限数值");
      }
    }
    const thresholds = scoring.starThresholds;
    if (!Array.isArray(thresholds) || thresholds.length !== 3 || !thresholds.every(Number.isFinite)) {
      addError(errors, level, "scoring.starThresholds 必须包含 3 个有限数值");
    } else if (!(thresholds[0] < thresholds[1] && thresholds[1] < thresholds[2])) {
      addError(errors, level, "scoring.starThresholds 必须严格递增");
    }

    const graph = buildUndirectedGraph(level);
    const relevantLocations = new Set(tasks.map((task) => task.location));
    relevantLocations.add(level.goal && level.goal.endLocation);
    relevantLocations.forEach((loc) => {
      if (loc && level.startLocation && !reachable(graph, level.startLocation, loc)) {
        addError(errors, level, "从起点 " + level.startLocation + " 无法到达地点 " + loc);
      }
    });

    if (!level.story) warnings.push("[" + level.id + "] 建议填写 story，避免关卡目标不明确");
  });

  return { errors, warnings };
}

function assertValidLevelData(levelData, options) {
  const result = validateLevelData(levelData, options);
  if (result.errors.length) {
    throw new Error("关卡配置校验失败:\n" + result.errors.join("\n"));
  }
  return result;
}

module.exports = { validateLevelData, assertValidLevelData };

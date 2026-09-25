const { parseTime, formatTime } = require("./time");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildTravelGraph(level) {
  const graph = {};

  function addEdge(from, to, duration) {
    if (!graph[from]) graph[from] = [];
    graph[from].push({ to, duration });
  }

  (level.travel || []).forEach((edge) => {
    addEdge(edge.from, edge.to, edge.duration);
    if (edge.bidirectional !== false) addEdge(edge.to, edge.from, edge.duration);
  });

  return graph;
}

function shortestTravel(graph, from, to) {
  if (!from || !to || from === to) return { duration: 0 };

  const distance = { [from]: 0 };
  const visited = new Set();

  while (true) {
    let current = null;
    let bestDistance = Infinity;

    Object.keys(distance).forEach((node) => {
      if (!visited.has(node) && distance[node] < bestDistance) {
        current = node;
        bestDistance = distance[node];
      }
    });

    if (current === null) break;
    if (current === to) return { duration: bestDistance };

    visited.add(current);
    (graph[current] || []).forEach((edge) => {
      const candidate = bestDistance + edge.duration;
      if (candidate < (distance[edge.to] ?? Infinity)) {
        distance[edge.to] = candidate;
      }
    });
  }

  return null;
}

function locationName(level, id) {
  const item = (level.locations || []).find((x) => x.id === id);
  return item ? item.name : id;
}

function applyAction(level, action) {
  if (action.type === "modify_deadline") {
    level.goal.deadline = action.newDeadline;
    return;
  }

  if (action.type === "modify_travel_time") {
    const edge = (level.travel || []).find((x) => x.id === action.travelId);
    if (!edge) throw new Error("找不到 travelId: " + action.travelId);
    edge.duration = Math.max(0, edge.duration + (action.delta || 0));
    return;
  }

  if (action.type === "modify_task_duration") {
    const task = (level.tasks || []).find((x) => x.id === action.taskId);
    if (!task) throw new Error("找不到 taskId: " + action.taskId);
    task.duration = Math.max(0, task.duration + (action.delta || 0));
    return;
  }

  throw new Error("暂不支持事件 action: " + action.type);
}

function fireStartEvents(level, timeline, time) {
  (level.events || []).forEach((event) => {
    if (!event.trigger || event.trigger.type !== "simulation_start") return;

    (event.actions || []).forEach((action) => applyAction(level, action));
    if (event.message) {
      timeline.push({ type: "event", at: time, text: "⚠️ " + event.message });
    }
  });
}

function calculateScore(level, result) {
  const scoring = level.scoring || {};
  const deadline = result.effectiveDeadlineMinutes;
  const earlyMinutes = Math.max(0, deadline - result.arrivalTime);
  const lateMinutes = Math.max(0, result.arrivalTime - deadline);

  const breakdown = {
    base: result.success ? (scoring.successBase ?? 100) : (scoring.failureBase ?? 50),
    earlyBonus: result.success ? earlyMinutes * (scoring.earlyBonusPerMinute ?? 1) : 0,
    waitingPenalty: result.waitingMinutes * (scoring.waitingPenaltyPerMinute ?? 2),
    latePenalty: result.success ? 0 : lateMinutes * (scoring.latePenaltyPerMinute ?? 10),
    violationPenalty: result.violations.length * (scoring.violationPenalty ?? 50),
    final: 0,
  };

  breakdown.final = Math.max(
    0,
    breakdown.base
      + breakdown.earlyBonus
      - breakdown.waitingPenalty
      - breakdown.latePenalty
      - breakdown.violationPenalty
  );

  return breakdown;
}

function scoreToStars(level, score, success) {
  if (!success) return 0;

  const thresholds = (level.scoring && level.scoring.starThresholds) || [100, 115, 130];
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  return 1;
}

function simulateLevel(originalLevel, taskOrder) {
  const level = deepClone(originalLevel);
  const timeline = [];
  const violations = [];
  const completedAt = {};
  const allTaskIds = new Set(level.tasks.map((task) => task.id));

  const uniqueOrder = new Set(taskOrder);
  if (taskOrder.length !== level.tasks.length || uniqueOrder.size !== taskOrder.length) {
    violations.push("必须且只能安排每个任务一次");
  }
  taskOrder.forEach((taskId) => {
    if (!allTaskIds.has(taskId)) violations.push("未知任务: " + taskId);
  });

  let time = parseTime(level.timeline.start);
  let currentLocation = level.startLocation;
  let waitingMinutes = 0;
  let travelMinutes = 0;

  fireStartEvents(level, timeline, time);

  const graph = buildTravelGraph(level);

  if (!violations.length) {
    for (let i = 0; i < taskOrder.length; i++) {
      const task = level.tasks.find((x) => x.id === taskOrder[i]);

      for (const dependencyId of task.dependsOn || []) {
        if (completedAt[dependencyId] === undefined) {
          const dependency = level.tasks.find((x) => x.id === dependencyId);
          violations.push(task.name + " 之前必须先完成 " + (dependency ? dependency.name : dependencyId));
        }
      }
      if (violations.length) break;

      if (task.location && task.location !== currentLocation) {
        const travel = shortestTravel(graph, currentLocation, task.location);
        if (!travel) {
          violations.push("无法从 " + locationName(level, currentLocation) + " 到达 " + locationName(level, task.location));
          break;
        }
        if (travel.duration > 0) {
          timeline.push({
            type: "travel",
            start: time,
            end: time + travel.duration,
            text: locationName(level, currentLocation) + " → " + locationName(level, task.location),
          });
          time += travel.duration;
          travelMinutes += travel.duration;
        }
        currentLocation = task.location;
      }

      if (task.availableAfter) {
        const availableAfter = parseTime(task.availableAfter);
        if (time < availableAfter) {
          const wait = availableAfter - time;
          timeline.push({
            type: "wait",
            start: time,
            end: availableAfter,
            text: "等待 " + task.name + " 可以开始",
          });
          waitingMinutes += wait;
          time = availableAfter;
        }
      }

      for (const gap of task.minGapAfter || []) {
        const dependencyFinishedAt = completedAt[gap.taskId];
        if (dependencyFinishedAt !== undefined) {
          const earliest = dependencyFinishedAt + gap.minutes;
          if (time < earliest) {
            const wait = earliest - time;
            timeline.push({
              type: "wait",
              start: time,
              end: earliest,
              text: "等待 " + gap.minutes + " 分钟后再进行 " + task.name,
            });
            waitingMinutes += wait;
            time = earliest;
          }
        }
      }

      const taskStart = time;
      time += task.duration;
      timeline.push({
        type: "task",
        taskId: task.id,
        start: taskStart,
        end: time,
        text: task.name,
      });

      if (task.finishBefore && time > parseTime(task.finishBefore)) {
        violations.push(task.name + " 必须在 " + task.finishBefore + " 前完成");
        break;
      }

      completedAt[task.id] = time;
    }
  }

  if (!violations.length && level.goal.endLocation && currentLocation !== level.goal.endLocation) {
    const travel = shortestTravel(graph, currentLocation, level.goal.endLocation);
    if (!travel) {
      violations.push("无法从 " + locationName(level, currentLocation) + " 到达 " + locationName(level, level.goal.endLocation));
    } else {
      timeline.push({
        type: "travel",
        start: time,
        end: time + travel.duration,
        text: locationName(level, currentLocation) + " → " + locationName(level, level.goal.endLocation),
      });
      time += travel.duration;
      travelMinutes += travel.duration;
      currentLocation = level.goal.endLocation;
    }
  }

  const effectiveDeadlineMinutes = parseTime(level.goal.deadline);
  const success =
    violations.length === 0
    && currentLocation === level.goal.endLocation
    && time <= effectiveDeadlineMinutes;

  const result = {
    success,
    arrivalTime: time,
    lateMinutes: Math.max(0, time - effectiveDeadlineMinutes),
    waitingMinutes,
    travelMinutes,
    violations,
    timeline,
    effectiveDeadline: level.goal.deadline,
    effectiveDeadlineMinutes,
    score: 0,
    stars: 0,
    scoreBreakdown: null,
  };

  result.scoreBreakdown = calculateScore(level, result);
  result.score = result.scoreBreakdown.final;
  result.stars = scoreToStars(level, result.score, result.success);

  return result;
}

function describeResult(level, result) {
  if (result.violations.length) return result.violations[0];

  if (!result.success) {
    if (result.lateMinutes > 0) {
      const waitText = result.waitingMinutes > 0
        ? "，其中有 " + result.waitingMinutes + " 分钟花在等待上"
        : "";
      return "迟到了 " + result.lateMinutes + " 分钟" + waitText + "。换个顺序再试试。";
    }
    return (level.resultTexts && level.resultTexts.failure) || "这次安排没有完成目标。";
  }

  if (result.stars === 3) return (level.resultTexts && level.resultTexts.perfect) || "安排非常漂亮。";
  if (result.stars === 2) return (level.resultTexts && level.resultTexts.good) || "不错，还有一点优化空间。";
  return (level.resultTexts && level.resultTexts.success) || "成功通关，还可以继续优化。";
}

function timelineToView(timeline) {
  return timeline.map((item) => ({
    ...item,
    timeText: item.at !== undefined
      ? formatTime(item.at)
      : formatTime(item.start) + "–" + formatTime(item.end),
  }));
}

module.exports = { simulateLevel, describeResult, timelineToView };

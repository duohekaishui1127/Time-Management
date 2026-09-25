const DEFAULT_SCORING = {
  successBase: 100,
  failureBase: 50,
  earlyBonusPerMinute: 2,
  waitingPenaltyPerMinute: 2,
  latePenaltyPerMinute: 10,
  violationPenalty: 50,
  starThresholds: [100, 110, 120],
};

// Route IDs are stable because events refer to them.
function route(from, to, duration, bidirectional = true) {
  return { id: from + "_" + to, from, to, duration, bidirectional };
}

function level(spec) {
  return {
    id: spec.id,
    chapter: spec.chapter,
    name: spec.name,
    story: spec.story,
    timeline: { start: spec.start },
    startLocation: spec.from,
    goal: { deadline: spec.deadline, endLocation: spec.to },
    locations: Object.keys(spec.locations).map((id) => ({ id, name: spec.locations[id] })),
    travel: spec.travel,
    tasks: spec.tasks,
    events: spec.events || [],
    scoring: { ...DEFAULT_SCORING, ...(spec.scoring || {}), starThresholds: spec.stars || DEFAULT_SCORING.starThresholds },
    resultTexts: {
      success: "赶上了，但安排还能更顺。",
      good: "安排得很稳。",
      perfect: spec.perfect || "这次时间刚刚好。",
    },
  };
}

module.exports = { level, route };

function parseTime(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = String(value);
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) throw new Error("非法时间格式: " + text);

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("非法时间值: " + text);
  }
  return hour * 60 + minute;
}

function formatTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

module.exports = { parseTime, formatTime };

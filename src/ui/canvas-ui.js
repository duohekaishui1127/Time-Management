const { formatTime } = require("../core/time");

const COLORS = {
  bg: "#F6F4EE",
  panel: "#FFFFFF",
  panel2: "#F3F5EF",
  ink: "#20332D",
  muted: "#59695F",
  line: "#E2E7DF",
  locked: "#5F7065",
  gold: "#9D6216",
  danger: "#A64F45",
};

const CHAPTER_THEMES = {
  college: { accent: "#2B725C", soft: "#E7F2EA" },
  city: { accent: "#336F92", soft: "#E7F1F6" },
  work: { accent: "#705693", soft: "#F0ECF7" },
  travel: { accent: "#9C5938", soft: "#F8EEE6" },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

class CanvasUI {
  constructor(canvas, system) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = system.windowWidth;
    this.height = system.windowHeight;
    this.dpr = system.pixelRatio || 1;

    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    this.hitAreas = [];
    this.theme = CHAPTER_THEMES.college;
  }

  setTheme(chapter) {
    this.theme = CHAPTER_THEMES[chapter] || CHAPTER_THEMES.college;
  }

  begin() {
    this.hitAreas = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  hitTest(x, y) {
    for (let i = this.hitAreas.length - 1; i >= 0; i--) {
      const h = this.hitAreas[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  }

  addHit(id, x, y, w, h, data) {
    this.hitAreas.push({ id, x, y, w, h, data });
  }

  scaleFont(px) {
    return Math.max(10, Math.round(px * clamp(this.width / 390, 0.92, 1.08)));
  }

  roundedRect(x, y, w, h, r, fill, stroke) {
    const ctx = this.ctx;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  text(value, x, y, size, color, weight, align, maxWidth) {
    const ctx = this.ctx;
    let label = String(value);
    let fontSize = size;
    ctx.fillStyle = color || COLORS.ink;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = (weight || 400) + " " + this.scaleFont(fontSize) + "px sans-serif";
    if (maxWidth) {
      while (fontSize > Math.max(11, size - 6) && ctx.measureText(label).width > maxWidth) {
        fontSize--;
        ctx.font = (weight || 400) + " " + this.scaleFont(fontSize) + "px sans-serif";
      }
      if (ctx.measureText(label).width > maxWidth) {
        while (label.length > 1 && ctx.measureText(label + "…").width > maxWidth) label = label.slice(0, -1);
        label += "…";
      }
    }
    ctx.fillText(label, x, y);
  }

  wrapText(value, x, y, maxWidth, lineHeight, maxLines, color, size) {
    const ctx = this.ctx;
    ctx.fillStyle = color || COLORS.muted;
    ctx.font = "400 " + this.scaleFont(size || 13) + "px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const chars = Array.from(String(value));
    let line = "";
    let lineNo = 0;
    for (let i = 0; i < chars.length; i++) {
      const next = line + chars[i];
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next;
        continue;
      }
      if (lineNo === maxLines - 1) {
        while (line && ctx.measureText(line + "…").width > maxWidth) line = line.slice(0, -1);
        ctx.fillText(line + "…", x, y + lineNo * lineHeight);
        return;
      }
      ctx.fillText(line, x, y + lineNo * lineHeight);
      lineNo++;
      line = chars[i];
    }
    if (line) ctx.fillText(line, x, y + lineNo * lineHeight);
  }

  renderHeader(title, subtitle) {
    this.ctx.fillStyle = this.theme.soft;
    this.ctx.fillRect(0, 0, this.width, 75);
    this.roundedRect(18, 16, 4, 13, 2, this.theme.accent, null);
    this.text(subtitle || "今天来得及吗？", 29, 28, 11, this.theme.accent, 700, "left", this.width - 120);
    this.text(title, 18, 61, 25, COLORS.ink, 750, "left", this.width - 112);
    this.roundedRect(this.width - 76, 22, 58, 34, 17, COLORS.panel, null);
    this.text("分享 ↗", this.width - 47, 44, 11, this.theme.accent, 700, "center");
    this.addHit("share", this.width - 76, 22, 58, 34);
  }

  renderLevelSelect(vm) {
    const pageLevels = vm.levels;
    this.setTheme(pageLevels[0] && pageLevels[0].level.chapter);
    this.renderHeader("选择关卡", vm.chapterTitle);
    this.text("已完成 " + vm.completedCount + " / " + vm.totalCount, 18, 89, 11, COLORS.muted, 650);
    this.text("继续你的时间挑战", this.width - 18, 89, 10, this.theme.accent, 600, "right");
    this.roundedRect(18, 96, this.width - 36, 4, 2, COLORS.line, null);
    if (vm.completedCount > 0) {
      this.roundedRect(18, 96, (this.width - 36) * vm.completedCount / vm.totalCount, 4, 2, this.theme.accent, null);
    }

    const cols = 2;
    const gap = 10;
    const pad = 18;
    const cardW = (this.width - pad * 2 - gap) / cols;
    const startY = 106;
    const rows = Math.ceil(pageLevels.length / cols);
    const availableH = this.height - startY - (vm.totalPages > 1 ? 82 : 50);
    const cardH = clamp((availableH - Math.max(0, rows - 1) * 8) / Math.max(1, rows), 74, 104);

    pageLevels.forEach((entry, localIndex) => {
      const col = localIndex % cols;
      const row = Math.floor(localIndex / cols);
      const x = pad + col * (cardW + gap);
      const y = startY + row * (cardH + 8);
      const fill = entry.unlocked ? (entry.completed ? this.theme.soft : COLORS.panel) : "#ECEEE9";
      this.roundedRect(x, y, cardW, cardH, 16, fill, COLORS.line);
      this.roundedRect(x + 11, y + 9, 28, 22, 8, entry.unlocked ? this.theme.accent : "#D8DDD6", null);
      this.text(String(entry.index + 1).padStart(2, "0"), x + 25, y + 24, 10, entry.unlocked ? "#FFFFFF" : COLORS.muted, 750, "center");

      if (entry.unlocked) {
        if (entry.completed) this.text("已完成", x + cardW - 11, y + 24, 10, this.theme.accent, 700, "right");
        this.wrapText(entry.level.name, x + 12, y + 49, cardW - 24, 17, cardH >= 93 ? 2 : 1, COLORS.ink, 14);
        this.text("★".repeat(entry.stars) + "☆".repeat(3 - entry.stars), x + 12, y + cardH - 10, 13, entry.stars ? COLORS.gold : COLORS.locked, 700);
        if (entry.attempts) this.text(entry.attempts + " 次尝试", x + cardW - 11, y + cardH - 11, 9, COLORS.muted, 500, "right");
      } else {
        this.text("🔒", x + 12, y + 51, 16, COLORS.muted, 600);
        this.text("尚未解锁", x + 39, y + 49, 13, COLORS.muted, 650, "left", cardW - 50);
        this.text("通关或广告解锁", x + 12, y + cardH - 11, 9, COLORS.muted, 500);
      }

      this.addHit("level", x, y, cardW, cardH, {
        index: entry.index,
        unlocked: entry.unlocked,
      });
    });

    if (vm.totalPages > 1) {
      const y = this.height - 58;
      this.roundedRect(18, y, 78, 36, 12, vm.page > 0 ? COLORS.panel : "#E9ECE6", null);
      this.text("← 上一页", 57, y + 23, 11, vm.page > 0 ? this.theme.accent : COLORS.locked, 650, "center");
      if (vm.page > 0) this.addHit("level-page-prev", 18, y, 78, 36);

      this.text((vm.page + 1) + " / " + vm.totalPages, this.width / 2, y + 23, 11, this.theme.accent, 750, "center");

      this.roundedRect(this.width - 96, y, 78, 36, 12, vm.page + 1 < vm.totalPages ? COLORS.panel : "#E9ECE6", null);
      this.text("下一页 →", this.width - 57, y + 23, 11, vm.page + 1 < vm.totalPages ? this.theme.accent : COLORS.locked, 650, "center");
      if (vm.page + 1 < vm.totalPages) this.addHit("level-page-next", this.width - 96, y, 78, 36);
    } else {
      this.text("通关自动解锁下一关 · 广告可提前解锁", 18, this.height - 18, 10, COLORS.muted, 500, "left", this.width - 36);
    }
  }

  renderGame(vm) {
    const level = vm.level;
    this.setTheme(level.chapter);
    this.renderHeader((vm.levelIndex + 1) + ". " + level.name, vm.chapterTitle);

    this.roundedRect(18, 76, 72, 28, 10, COLORS.panel, null);
    this.text("← 选关", 54, 95, 11, this.theme.accent, 700, "center");
    this.addHit("back", 18, 76, 72, 28);

    const gx = 18, gy = 114, gw = this.width - 36, gh = 108;
    this.roundedRect(gx, gy, gw, gh, 18, COLORS.panel, COLORS.line);
    this.roundedRect(gx + 14, gy + 15, 4, 20, 2, this.theme.accent, null);
    this.text(level.timeline.start + "  →  " + level.goal.deadline, gx + 26, gy + 30, 14, COLORS.ink, 750, "left", gw * 0.52);
    this.text("终点 · " + vm.goalLocationName, gx + gw - 14, gy + 29, 11, this.theme.accent, 650, "right", gw * 0.42);
    this.roundedRect(gx + 14, gy + 43, gw - 28, 1, 0, COLORS.line, null);
    this.wrapText(level.story, gx + 14, gy + 62, gw - 28, 18, 3, COLORS.muted, 12);

    const py = gy + gh + 14;
    this.text("我的路线", 18, py + 16, 12, this.theme.accent, 750);
    this.text(vm.selectedIds.length + " / " + level.tasks.length + " 已安排", this.width - 18, py + 16, 11, COLORS.muted, 650, "right");

    const pillY = py + 29;
    const pillGap = 6;
    const total = level.tasks.length;
    const pillW = (this.width - 36 - pillGap * (total - 1)) / total;
    for (let i = 0; i < total; i++) {
      const id = vm.selectedIds[i];
      const x = 18 + i * (pillW + pillGap);
      this.roundedRect(x, pillY, pillW, 54, 13, id ? this.theme.accent : this.theme.soft, id ? null : COLORS.line);
      if (id) {
        const task = level.tasks.find((t) => t.id === id);
        this.text(String(i + 1), x + pillW / 2, pillY + 17, 9, "#D7EBE0", 700, "center");
        this.text(task.icon || "•", x + pillW / 2, pillY + 41, pillW < 48 ? 14 : 17, "#FFFFFF", 500, "center");
        this.addHit("remove-selected", x, pillY, pillW, 54, { id });
      } else {
        this.text(String(i + 1), x + pillW / 2, pillY + 33, 15, this.theme.accent, 650, "center");
      }
    }

    const taskStartY = pillY + 76;
    const remaining = vm.cardOrder.filter((id) => !vm.selectedIds.includes(id));
    this.text("待安排任务", 18, taskStartY, 12, COLORS.ink, 750);
    this.text(remaining.length + " 张卡片", this.width - 18, taskStartY, 10, COLORS.muted, 600, "right");

    const cols = 2;
    const gap = 10;
    const cardW = (this.width - 36 - gap) / cols;
    const cardH = 86;
    const by = this.height - 84;
    const cardTop = taskStartY + 12;
    const navY = by - 35;
    const rowsPerPage = Math.max(1, Math.floor((navY - 10 - cardTop + 9) / (cardH + 9)));
    const pageSize = cols * rowsPerPage;
    const totalPages = Math.max(1, Math.ceil(remaining.length / pageSize));
    const page = clamp(vm.taskPage || 0, 0, totalPages - 1);

    remaining.slice(page * pageSize, (page + 1) * pageSize).forEach((id, idx) => {
      const task = level.tasks.find((t) => t.id === id);
      const place = level.locations.find((item) => item.id === task.location);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 18 + col * (cardW + gap);
      const y = cardTop + row * (cardH + 9);
      this.roundedRect(x, y, cardW, cardH, 16, COLORS.panel, COLORS.line);
      this.roundedRect(x + 11, y + 10, 36, 36, 11, this.theme.soft, null);
      this.text(task.icon || "•", x + 29, y + 36, 19, this.theme.accent, 500, "center");
      this.text(task.name, x + 55, y + 27, 13, COLORS.ink, 750, "left", cardW - 66);
      this.text((place ? place.name : task.location) + " · " + task.duration + "分", x + 55, y + 46, 10, COLORS.muted, 550, "left", cardW - 66);
      this.roundedRect(x + 11, y + 57, cardW - 22, 1, 0, COLORS.line, null);
      const hint = task.availableAfter ? task.availableAfter + " 后可做"
        : task.finishBefore ? task.finishBefore + " 前完成"
          : task.dependsOn && task.dependsOn.length ? "需要先完成前置任务" : "点击加入安排";
      this.text(hint, x + 12, y + 76, 10, task.availableAfter || task.finishBefore ? this.theme.accent : COLORS.muted, 600, "left", cardW - 24);
      this.addHit("task", x, y, cardW, cardH, { id });
    });

    if (totalPages > 1) {
      this.text("← 上一页", 54, navY + 19, 11, page > 0 ? this.theme.accent : COLORS.locked, 650, "center");
      if (page > 0) this.addHit("task-page-prev", 18, navY, 72, 28);
      this.text((page + 1) + " / " + totalPages, this.width / 2, navY + 19, 11, this.theme.accent, 750, "center");
      this.text("下一页 →", this.width - 54, navY + 19, 11, page + 1 < totalPages ? this.theme.accent : COLORS.locked, 650, "center");
      if (page + 1 < totalPages) this.addHit("task-page-next", this.width - 90, navY, 72, 28);
    } else if (remaining.length === 0) {
      this.text("安排完成，准备出发！", this.width / 2, cardTop + 42, 13, this.theme.accent, 700, "center");
    }

    this.roundedRect(12, by, this.width - 24, 76, 20, COLORS.panel, COLORS.line);
    this.roundedRect(22, by + 13, 60, 48, 14, this.theme.soft, null);
    this.text("↶", 52, by + 35, 18, this.theme.accent, 700, "center");
    this.text("撤销", 52, by + 53, 9, COLORS.muted, 650, "center");
    this.addHit("undo", 22, by + 13, 60, 48);

    this.roundedRect(90, by + 13, 60, 48, 14, this.theme.soft, null);
    this.text("↻", 120, by + 35, 18, this.theme.accent, 700, "center");
    this.text("重排", 120, by + 53, 9, COLORS.muted, 650, "center");
    this.addHit("reset", 90, by + 13, 60, 48);

    const ready = vm.selectedIds.length === level.tasks.length;
    this.roundedRect(160, by + 13, this.width - 192, 48, 14, ready ? this.theme.accent : "#DCE5DD", null);
    this.text(ready ? "开始执行 →" : "还差 " + (level.tasks.length - vm.selectedIds.length) + " 个任务",
      (160 + this.width - 32) / 2, by + 43, 13, ready ? "#FFFFFF" : COLORS.ink, 750, "center", this.width - 210);
    if (ready) this.addHit("run", 160, by + 13, this.width - 192, 48);
  }

  renderResultSheet(vm) {
    const r = vm.result;
    const h = vm.expanded ? Math.min(this.height * 0.84, 680) : 382;
    const y = this.height - h;
    const statusColor = r.success ? this.theme.accent : COLORS.danger;
    const statusSoft = r.success ? this.theme.soft : "#FAEBE7";

    // The sheet is modal: only its own controls should receive taps.
    this.hitAreas = [];
    this.ctx.fillStyle = "rgba(25,39,32,.38)";
    this.ctx.fillRect(0, 0, this.width, y);
    this.roundedRect(0, y, this.width, h + 30, 24, COLORS.panel, null);
    this.roundedRect(0, y, this.width, 5, 2, statusColor, null);
    this.roundedRect(this.width / 2 - 22, y + 11, 44, 4, 2, COLORS.line, null);

    this.roundedRect(20, y + 28, 32, 32, 11, statusSoft, null);
    this.text(r.success ? "✓" : "!", 36, y + 51, 20, statusColor, 800, "center");
    this.text(r.success ? "挑战成功" : "挑战失败", 62, y + 52, 21, COLORS.ink, 800);
    this.text("★".repeat(r.stars) + "☆".repeat(3 - r.stars), this.width - 20, y + 51, 20, COLORS.gold, 700, "right");

    const stats = [
      ["到达", formatTime(r.arrivalTime)],
      ["截止", r.effectiveDeadline],
      ["等待", r.waitingMinutes + " 分"],
      ["得分", Math.round(r.score)],
    ];
    const sw = (this.width - 40 - 9 * 3) / 4;
    stats.forEach((stat, i) => {
      const x = 20 + i * (sw + 9);
      this.roundedRect(x, y + 75, sw, 60, 12, i === 3 ? statusSoft : COLORS.panel2, null);
      this.text(stat[0], x + sw / 2, y + 96, 9, COLORS.muted, 650, "center");
      this.text(stat[1], x + sw / 2, y + 121, 14, i === 3 ? statusColor : COLORS.ink, 800, "center", sw - 8);
    });

    this.wrapText(vm.description, 20, y + 164, this.width - 40, 20, 2, COLORS.ink, 12);
    const detailY = y + 204;
    const detailW = this.width - 120;
    this.roundedRect(20, detailY, detailW, 38, 12, statusSoft, null);
    this.text(vm.expanded ? "收起执行与评分  ▲" : "查看执行与评分  ▼", 20 + detailW / 2, detailY + 25, 11, statusColor, 700, "center", detailW - 16);
    this.addHit("toggle-detail", 20, detailY, detailW, 38);
    this.roundedRect(this.width - 92, detailY, 72, 38, 12, statusSoft, null);
    this.text("分享 ↗", this.width - 56, detailY + 25, 11, statusColor, 700, "center");
    this.addHit("share", this.width - 92, detailY, 72, 38);

    if (vm.expanded) {
      const b = r.scoreBreakdown;
      this.text("基础" + b.base + " +早到" + b.earlyBonus + " -等待" + b.waitingPenalty
        + " -迟到" + b.latePenalty + " -违规" + b.violationPenalty + " =" + b.final,
      20, detailY + 62, 9, COLORS.muted, 600, "left", this.width - 40);

      const timeline = vm.timeline;
      const bottom = this.height - 74;
      const firstLineY = detailY + 92;
      const navY = bottom - 40;
      const pageSize = Math.max(1, Math.floor((navY - 12 - firstLineY) / 29) + 1);
      const totalPages = Math.max(1, Math.ceil(timeline.length / pageSize));
      const page = clamp(vm.timelinePage || 0, 0, totalPages - 1);
      timeline.slice(page * pageSize, (page + 1) * pageSize).forEach((item, i) => {
        const lineY = firstLineY + i * 29;
        const lineColor = item.type === "event" ? COLORS.danger : item.type === "wait" ? COLORS.gold : this.theme.accent;
        this.roundedRect(97, lineY - 12, 3, 14, 2, lineColor, null);
        this.text(item.timeText, 22, lineY, 10, COLORS.muted, 650, "left", 70);
        this.text(item.text, 108, lineY, 11, COLORS.ink, 550, "left", this.width - 130);
      });
      if (totalPages > 1) {
        this.text("← 上一页", 56, navY + 19, 11, page > 0 ? statusColor : COLORS.locked, 650, "center");
        if (page > 0) this.addHit("timeline-page-prev", 20, navY, 72, 28);
        this.text((page + 1) + " / " + totalPages, this.width / 2, navY + 19, 11, statusColor, 750, "center");
        this.text("下一页 →", this.width - 56, navY + 19, 11, page + 1 < totalPages ? statusColor : COLORS.locked, 650, "center");
        if (page + 1 < totalPages) this.addHit("timeline-page-next", this.width - 92, navY, 72, 28);
      }
    }

    const bottom = this.height - 74;
    this.roundedRect(20, bottom, 104, 48, 14, COLORS.panel2, null);
    this.text("重新挑战", 72, bottom + 31, 12, COLORS.ink, 700, "center");
    this.addHit("retry", 20, bottom, 104, 48);
    this.roundedRect(134, bottom, this.width - 154, 48, 14, statusColor, null);
    this.text(vm.nextText, (134 + this.width - 20) / 2, bottom + 31, 12, "#FFFFFF", 750, "center", this.width - 172);
    this.addHit("next", 134, bottom, this.width - 154, 48);
  }

}

module.exports = { CanvasUI };

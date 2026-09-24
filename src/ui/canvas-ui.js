const { formatTime } = require("../core/time");

const COLORS = {
  bg: "#F3F4F0",
  panel: "#FFFFFF",
  panel2: "#F7F7F3",
  ink: "#171817",
  muted: "#7A7E78",
  line: "#DFE1DB",
  locked: "#B9BDB7",
  gold: "#B57B00",
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

  text(text, x, y, size, color, weight, align) {
    const ctx = this.ctx;
    ctx.fillStyle = color || COLORS.ink;
    ctx.font = (weight || 400) + " " + this.scaleFont(size) + "px sans-serif";
    ctx.textAlign = align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(text), x, y);
  }

  wrapText(text, x, y, maxWidth, lineHeight, maxLines, color, size) {
    const ctx = this.ctx;
    ctx.fillStyle = color || COLORS.muted;
    ctx.font = "400 " + this.scaleFont(size || 13) + "px sans-serif";
    ctx.textAlign = "left";

    const chars = Array.from(String(text));
    let line = "";
    let lineNo = 0;

    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y + lineNo * lineHeight);
        line = chars[i];
        lineNo++;
        if (lineNo >= maxLines - 1) break;
      } else {
        line = test;
      }
    }

    if (lineNo < maxLines) ctx.fillText(line, x, y + lineNo * lineHeight);
  }

  renderHeader(title, subtitle) {
    this.text(subtitle || "今天来得及吗？", 18, 30, 11, COLORS.muted, 600);
    this.text(title, 18, 60, 25, COLORS.ink, 750);

    this.roundedRect(this.width - 74, 22, 56, 34, 17, COLORS.panel, COLORS.line);
    this.text("分享", this.width - 46, 44, 12, COLORS.ink, 600, "center");
    this.addHit("share", this.width - 74, 22, 56, 34);
  }

  renderLevelSelect(vm) {
    this.renderHeader("选择关卡", vm.chapterTitle);
    this.text("已完成 " + vm.completedCount + " / " + vm.totalCount, 18, 88, 12, COLORS.muted, 500);

    const pageLevels = vm.levels;
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

      this.roundedRect(x, y, cardW, cardH, 16, entry.unlocked ? COLORS.panel : "#E7E9E4", COLORS.line);
      this.text(String(entry.index + 1).padStart(2, "0"), x + 12, y + 22, 11, COLORS.muted, 700);

      if (entry.unlocked) {
        this.wrapText(entry.level.name, x + 12, y + 44, cardW - 24, 17, 2, COLORS.ink, 15);
        this.text(
          "★".repeat(entry.stars) + "☆".repeat(3 - entry.stars),
          x + 12,
          y + cardH - 11,
          14,
          entry.stars ? COLORS.gold : COLORS.locked,
          700
        );
      } else {
        this.text("🔒", x + 12, y + 47, 17, COLORS.muted, 600);
        this.text("未解锁", x + 40, y + 46, 14, COLORS.muted, 650);
        this.text("广告可提前解锁", x + 12, y + cardH - 11, 10, COLORS.muted, 500);
      }

      this.addHit("level", x, y, cardW, cardH, {
        index: entry.index,
        unlocked: entry.unlocked,
      });
    });

    if (vm.totalPages > 1) {
      const y = this.height - 58;
      this.roundedRect(18, y, 76, 36, 18, vm.page > 0 ? COLORS.panel : "#E3E5E0", COLORS.line);
      this.text("← 上一页", 56, y + 23, 11, vm.page > 0 ? COLORS.ink : COLORS.locked, 600, "center");
      if (vm.page > 0) this.addHit("level-page-prev", 18, y, 76, 36);

      this.text((vm.page + 1) + " / " + vm.totalPages, this.width / 2, y + 23, 11, COLORS.muted, 600, "center");

      this.roundedRect(this.width - 94, y, 76, 36, 18, vm.page + 1 < vm.totalPages ? COLORS.panel : "#E3E5E0", COLORS.line);
      this.text("下一页 →", this.width - 56, y + 23, 11, vm.page + 1 < vm.totalPages ? COLORS.ink : COLORS.locked, 600, "center");
      if (vm.page + 1 < vm.totalPages) this.addHit("level-page-next", this.width - 94, y, 76, 36);
    } else {
      this.text("正常通关自动解锁下一关；广告只用于提前解锁。", 18, this.height - 18, 10, COLORS.muted, 500);
    }
  }

  renderGame(vm) {
    const level = vm.level;
    this.renderHeader((vm.levelIndex + 1) + ". " + level.name, vm.chapterTitle);

    this.roundedRect(18, 74, 58, 30, 15, COLORS.panel, COLORS.line);
    this.text("← 关卡", 47, 94, 11, COLORS.ink, 600, "center");
    this.addHit("back", 18, 74, 58, 30);

    const gx = 18, gy = 114, gw = this.width - 36, gh = 108;
    this.roundedRect(gx, gy, gw, gh, 18, COLORS.panel, COLORS.line);
    this.text(level.timeline.start + "  →  " + level.goal.deadline, gx + 14, gy + 24, 12, COLORS.ink, 700);
    this.text("目标：" + vm.goalLocationName, gx + gw - 14, gy + 24, 11, COLORS.muted, 600, "right");
    this.wrapText(level.story, gx + 14, gy + 50, gw - 28, 19, 3, COLORS.muted, 12);

    const py = gy + gh + 14;
    this.text("你的安排", 18, py + 16, 12, COLORS.muted, 700);
    this.text(vm.selectedIds.length + " / " + level.tasks.length, this.width - 18, py + 16, 12, COLORS.muted, 700, "right");

    const pillY = py + 29;
    const pillGap = 6;
    const total = level.tasks.length;
    const pillW = (this.width - 36 - pillGap * (total - 1)) / total;

    for (let i = 0; i < total; i++) {
      const id = vm.selectedIds[i];
      const x = 18 + i * (pillW + pillGap);
      this.roundedRect(x, pillY, pillW, 54, 13, id ? COLORS.ink : "#E4E6E1", null);

      if (id) {
        const task = level.tasks.find((t) => t.id === id);
        this.text(String(i + 1), x + pillW / 2, pillY + 18, 9, "#C9CCC6", 700, "center");
        this.text(task.icon || "•", x + pillW / 2, pillY + 40, pillW < 48 ? 14 : 17, "#FFFFFF", 500, "center");
        this.addHit("remove-selected", x, pillY, pillW, 54, { id });
      }
    }

    const taskStartY = pillY + 76;
    this.text("待安排任务", 18, taskStartY, 12, COLORS.muted, 700);

    const remaining = vm.cardOrder.filter((id) => !vm.selectedIds.includes(id));
    const cols = 2;
    const gap = 10;
    const cardW = (this.width - 36 - gap) / 2;
    const cardH = 86;

    remaining.forEach((id, idx) => {
      const task = level.tasks.find((t) => t.id === id);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 18 + col * (cardW + gap);
      const y = taskStartY + 12 + row * (cardH + 9);

      this.roundedRect(x, y, cardW, cardH, 16, COLORS.panel, COLORS.line);
      this.text(task.icon || "◻️", x + 14, y + 30, 20, COLORS.ink, 400);
      this.text(task.name, x + 46, y + 28, 14, COLORS.ink, 700);
      this.text(task.duration + " MIN", x + 46, y + 50, 10, COLORS.muted, 700);

      if (task.availableAfter) {
        this.text(task.availableAfter + " 后可做", x + 14, y + 72, 10, COLORS.muted, 500);
      } else if (task.finishBefore) {
        this.text(task.finishBefore + " 前完成", x + 14, y + 72, 10, COLORS.muted, 500);
      } else if (task.dependsOn && task.dependsOn.length) {
        this.text("有前置任务", x + 14, y + 72, 10, COLORS.muted, 500);
      }

      this.addHit("task", x, y, cardW, cardH, { id });
    });

    const by = this.height - 84;
    this.roundedRect(12, by, this.width - 24, 76, 20, "rgba(255,255,255,0.97)", COLORS.line);

    this.roundedRect(22, by + 13, 60, 48, 14, COLORS.panel2, null);
    this.text("↶", 52, by + 35, 18, COLORS.ink, 600, "center");
    this.text("撤销", 52, by + 53, 9, COLORS.muted, 600, "center");
    this.addHit("undo", 22, by + 13, 60, 48);

    this.roundedRect(90, by + 13, 60, 48, 14, COLORS.panel2, null);
    this.text("↻", 120, by + 35, 18, COLORS.ink, 600, "center");
    this.text("重排", 120, by + 53, 9, COLORS.muted, 600, "center");
    this.addHit("reset", 90, by + 13, 60, 48);

    const ready = vm.selectedIds.length === level.tasks.length;
    this.roundedRect(160, by + 13, this.width - 192, 48, 14, ready ? COLORS.ink : "#C9CCC6", null);
    this.text(
      ready ? "开始执行 →" : "还差 " + (level.tasks.length - vm.selectedIds.length) + " 个任务",
      (160 + this.width - 32) / 2,
      by + 43,
      13,
      "#FFFFFF",
      700,
      "center"
    );
    if (ready) this.addHit("run", 160, by + 13, this.width - 192, 48);
  }

  renderResultSheet(vm) {
    const r = vm.result;
    const h = vm.expanded ? Math.min(this.height * 0.84, 680) : 382;
    const y = this.height - h;

    this.ctx.fillStyle = "rgba(0,0,0,.28)";
    this.ctx.fillRect(0, 0, this.width, y);

    this.roundedRect(0, y, this.width, h + 30, 24, COLORS.panel, null);
    this.roundedRect(this.width / 2 - 22, y + 10, 44, 4, 2, "#D7D9D3", null);

    this.text(r.success ? "挑战成功" : "挑战失败", 20, y + 50, 23, COLORS.ink, 800);
    this.text("★".repeat(r.stars) + "☆".repeat(3 - r.stars), this.width - 20, y + 49, 22, COLORS.gold, 700, "right");

    const stats = [
      ["到达", formatTime(r.arrivalTime)],
      ["截止", r.effectiveDeadline],
      ["等待", r.waitingMinutes + "m"],
      ["得分", Math.round(r.score)],
    ];
    const sw = (this.width - 40 - 9 * 3) / 4;

    stats.forEach((s, i) => {
      const x = 20 + i * (sw + 9);
      this.roundedRect(x, y + 69, sw, 62, 13, COLORS.panel2, null);
      this.text(s[0], x + sw / 2, y + 90, 9, COLORS.muted, 600, "center");
      this.text(s[1], x + sw / 2, y + 116, 14, COLORS.ink, 750, "center");
    });

    this.wrapText(vm.description, 20, y + 160, this.width - 40, 20, 2, COLORS.ink, 12);

    const detailY = y + 204;
    this.roundedRect(20, detailY, this.width - 40, 38, 12, COLORS.panel2, null);
    this.text(vm.expanded ? "收起执行与评分 ▲" : "查看执行与评分 ▼", this.width / 2, detailY + 25, 11, COLORS.ink, 650, "center");
    this.addHit("toggle-detail", 20, detailY, this.width - 40, 38);

    if (vm.expanded) {
      const b = r.scoreBreakdown;
      this.text(
        "评分  基础 " + b.base
          + "  + 提前 " + b.earlyBonus
          + "  - 等待 " + b.waitingPenalty
          + "  - 迟到 " + b.latePenalty,
        20,
        detailY + 62,
        10,
        COLORS.muted,
        600
      );

      const timeline = vm.timeline;
      const max = Math.min(timeline.length, 7);
      for (let i = 0; i < max; i++) {
        const item = timeline[i];
        this.text(item.timeText, 22, detailY + 92 + i * 29, 10, COLORS.muted, 600);
        this.text(item.text, 108, detailY + 92 + i * 29, 11, COLORS.ink, 500);
      }
    }

    const bottom = this.height - 74;
    this.roundedRect(20, bottom, 104, 48, 14, COLORS.panel2, null);
    this.text("重新挑战", 72, bottom + 31, 12, COLORS.ink, 650, "center");
    this.addHit("retry", 20, bottom, 104, 48);

    this.roundedRect(134, bottom, this.width - 154, 48, 14, COLORS.ink, null);
    this.text(vm.nextText, (134 + this.width - 20) / 2, bottom + 31, 12, "#FFFFFF", 700, "center");
    this.addHit("next", 134, bottom, this.width - 154, 48);
  }
}

module.exports = { CanvasUI };

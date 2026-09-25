const fs = require("node:fs");
const path = require("node:path");
const project = require("../project.config.json");
const game = require("../game.json");
const config = require("../src/config");

const errors = [];
const notes = [];

if (project.compileType !== "game") {
  errors.push("project.config.json 的 compileType 必须为 game。");
}
if (!project.appid || project.appid === "touristappid") {
  errors.push("将 project.config.json 的 appid 换成正式小游戏 AppID。");
}
if (!/^\d+\.\d+\.\d+$/.test(project.libVersion || "")) {
  errors.push("将 libVersion 固定为经过真机验证的基础库版本，不使用 latest。");
}
if (!project.setting || project.setting.minified !== true) {
  errors.push("将 project.config.json 的 setting.minified 设为 true。");
}
if (project.setting && project.setting.urlCheck === false) {
  notes.push("开发者工具关闭了合法域名校验；正式版应检查域名配置。");
}
if (game.deviceOrientation !== "portrait") {
  notes.push("当前界面按竖屏设计，请在目标设备检查方向与布局。");
}
if (!config.ads.rewardedVideoAdUnitId) {
  notes.push("激励视频广告位为空：正式版仅可通关解锁；若需要广告提前解锁，请配置广告位并真机验证。");
} else if (!/^adunit-/.test(config.ads.rewardedVideoAdUnitId)) {
  notes.push("请核对 rewardedVideoAdUnitId 是否为当前小游戏的正式广告位。");
}

const ignored = fs.existsSync(path.join(__dirname, "../.gitignore"))
  ? fs.readFileSync(path.join(__dirname, "../.gitignore"), "utf8")
  : "";
if (!ignored.includes("project.private.config.json")) {
  notes.push("建议忽略 project.private.config.json，避免提交开发者本地配置。");
}

for (const message of errors) console.error("错误：" + message);
for (const message of notes) console.log("提示：" + message);
if (errors.length) {
  console.error("发布预检未通过：" + errors.length + " 项配置待完成。");
  process.exitCode = 1;
} else {
  console.log("发布静态预检通过。仍需在开发者工具、真机和公众平台完成审核前检查。");
}

const { GameApp } = require("./src/app");

try {
  new GameApp();
} catch (error) {
  console.error(error);
  if (typeof wx !== "undefined" && wx.showModal) {
    wx.showModal({
      title: "游戏启动失败",
      content: String(error && error.message ? error.message : error).slice(0, 500),
      showCancel: false,
    });
  }
}

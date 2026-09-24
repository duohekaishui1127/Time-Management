class WeChatPlatform {
  constructor(options) {
    this.options = options || {};
    this.system = wx.getSystemInfoSync();
    this.rewardAd = null;
  }

  createCanvas() {
    return wx.createCanvas();
  }

  onTouchStart(handler) {
    wx.onTouchStart(handler);
  }

  getStorage(key) {
    try { return wx.getStorageSync(key); }
    catch (_) { return null; }
  }

  setStorage(key, value) {
    try { wx.setStorageSync(key, value); }
    catch (error) { console.warn("setStorage failed:", error); }
  }

  toast(title) {
    wx.showToast({ title, icon: "none", duration: 1800 });
  }

  modal(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || "提示",
        content: options.content || "",
        confirmText: options.confirmText || "确定",
        cancelText: options.cancelText || "取消",
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false),
      });
    });
  }

  fatalError(message) {
    console.error(message);
    wx.showModal({
      title: "启动失败",
      content: String(message).slice(0, 500),
      showCancel: false,
    });
  }

  haptic() {
    if (!wx.vibrateShort) return;
    try { wx.vibrateShort({ type: "light" }); }
    catch (_) {}
  }

  enableShare(getPayload) {
    if (wx.showShareMenu) wx.showShareMenu({ withShareTicket: false });
    if (wx.onShareAppMessage) wx.onShareAppMessage(() => getPayload());
  }

  share(payload) {
    if (!wx.shareAppMessage) {
      this.toast("当前环境不支持主动分享");
      return;
    }
    wx.shareAppMessage(payload);
  }

  getLaunchQuery() {
    try {
      const options = wx.getLaunchOptionsSync ? wx.getLaunchOptionsSync() : {};
      return options.query || {};
    } catch (_) {
      return {};
    }
  }

  async showRewardedVideo() {
    const adUnitId = this.options.rewardedVideoAdUnitId || "";
    const isDevtools = this.system.platform === "devtools";

    if (!adUnitId) {
      if (isDevtools && this.options.devtoolsSimulateRewardedAd) {
        return this.modal({
          title: "开发工具模拟广告",
          content: "当前没有配置广告位 ID。点击“模拟看完”后视为完整观看，仅用于本地调试。",
          confirmText: "模拟看完",
        });
      }
      this.toast("尚未配置激励视频广告位");
      return false;
    }

    if (!wx.createRewardedVideoAd) {
      this.toast("当前微信版本不支持激励广告");
      return false;
    }

    if (!this.rewardAd) {
      this.rewardAd = wx.createRewardedVideoAd({ adUnitId });
    }

    const ad = this.rewardAd;

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        if (ad.offClose) ad.offClose(onClose);
        if (ad.offError) ad.offError(onError);
      };

      const finish = (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const onClose = (res) => finish(!res || res.isEnded === true);
      const onError = (error) => {
        console.warn("rewarded ad error:", error);
        this.toast("广告暂时不可用");
        finish(false);
      };

      ad.onClose(onClose);
      if (ad.onError) ad.onError(onError);

      Promise.resolve()
        .then(() => ad.load ? ad.load() : null)
        .catch(() => null)
        .then(() => ad.show())
        .catch(() => {
          if (ad.load) return ad.load().then(() => ad.show());
          throw new Error("ad show failed");
        })
        .catch(onError);
    });
  }
}

module.exports = { WeChatPlatform };

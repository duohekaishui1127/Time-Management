class WeChatPlatform {
  constructor(options) {
    this.options = options || {};
    this.system = this.getSystemInfo();
    this.rewardAd = null;
    this.pendingReward = null;
    this.rewardTimedOut = false;
    this.storageReadFailed = false;
  }

  getSystemInfo() {
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    if (!wx.getWindowInfo) return system;
    try { return Object.assign({}, system, wx.getWindowInfo()); }
    catch (_) { return system; }
  }

  onWindowResize(handler) {
    if (!wx.onWindowResize) return;
    wx.onWindowResize((event) => {
      this.system = this.getSystemInfo();
      if (event && event.size) Object.assign(this.system, event.size);
      handler(this.system);
    });
  }

  createCanvas() {
    return wx.createCanvas();
  }

  onTouchStart(handler) {
    wx.onTouchStart(handler);
  }

  getStorage(key) {
    try { return wx.getStorageSync(key); }
    catch (error) {
      this.storageReadFailed = true;
      console.warn("getStorage failed:", error);
      return null;
    }
  }

  setStorage(key, value) {
    // A failed read must not be overwritten with a fresh empty save.
    if (this.storageReadFailed) return false;
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (error) {
      console.warn("setStorage failed:", error);
      return false;
    }
  }

  toast(title) {
    if (!wx.showToast) return;
    try { wx.showToast({ title, icon: "none", duration: 1800 }); }
    catch (error) { console.warn("showToast failed:", error); }
  }

  modal(options) {
    return new Promise((resolve) => {
      if (!wx.showModal) return resolve(false);
      try {
        wx.showModal({
          title: options.title || "提示",
          content: options.content || "",
          confirmText: options.confirmText || "确定",
          cancelText: options.cancelText || "取消",
          showCancel: options.showCancel !== false,
          success: (res) => resolve(!!res.confirm),
          fail: () => resolve(false),
        });
      } catch (error) {
        console.warn("showModal failed:", error);
        resolve(false);
      }
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
    if (wx.showShareMenu) {
      try { wx.showShareMenu({ withShareTicket: false }); }
      catch (error) { console.warn("showShareMenu failed:", error); }
    }
    if (wx.onShareAppMessage) {
      try { wx.onShareAppMessage(() => getPayload()); }
      catch (error) { console.warn("onShareAppMessage failed:", error); }
    }
  }

  share(payload) {
    if (!wx.shareAppMessage) {
      this.toast("当前环境不支持主动分享");
      return;
    }
    try { wx.shareAppMessage(payload); }
    catch (error) {
      console.warn("share failed:", error);
      this.toast("分享暂时不可用");
    }
  }

  getLaunchQuery() {
    try {
      const options = wx.getLaunchOptionsSync ? wx.getLaunchOptionsSync() : {};
      return options.query || {};
    } catch (_) {
      return {};
    }
  }

  canOfferRewardedVideo() {
    const adUnitId = this.options.rewardedVideoAdUnitId || "";
    return !this.rewardTimedOut && (
      (adUnitId && !!wx.createRewardedVideoAd)
      || (!adUnitId && this.system.platform === "devtools" && !!this.options.devtoolsSimulateRewardedAd)
    );
  }

  _finishReward(value) {
    const pending = this.pendingReward;
    if (!pending) return;
    this.pendingReward = null;
    clearTimeout(pending.timeout);
    pending.resolve(value === true);
  }

  _getRewardAd(adUnitId) {
    if (this.rewardAd) return this.rewardAd;
    const ad = wx.createRewardedVideoAd({ adUnitId });
    ad.onClose((result) => {
      if (this.rewardTimedOut) {
        this.rewardTimedOut = false;
        return;
      }
      // Only an explicit completed-view signal can grant an unlock.
      this._finishReward(!!result && result.isEnded === true);
    });
    if (ad.onError) {
      ad.onError((error) => {
        console.warn("rewarded ad error:", error);
        if (this.rewardTimedOut) {
          this.rewardTimedOut = false;
          return;
        }
        if (this.pendingReward) this.toast("广告暂时不可用");
        this._finishReward(false);
      });
    }
    this.rewardAd = ad;
    return ad;
  }

  async showRewardedVideo() {
    const adUnitId = this.options.rewardedVideoAdUnitId || "";
    if (!adUnitId) {
      if (this.system.platform === "devtools" && this.options.devtoolsSimulateRewardedAd) {
        return this.modal({
          title: "开发工具模拟广告",
          content: "当前没有配置广告位 ID。点击“模拟看完”后视为完整观看，仅用于本地调试。",
          confirmText: "模拟看完",
        });
      }
      this.toast("尚未配置激励视频广告位");
      return false;
    }

    if (!wx.createRewardedVideoAd || this.rewardTimedOut) {
      this.toast("广告暂时不可用");
      return false;
    }
    if (this.pendingReward) return false;

    let ad;
    try { ad = this._getRewardAd(adUnitId); }
    catch (error) {
      console.warn("create rewarded ad failed:", error);
      this.toast("广告暂时不可用");
      return false;
    }

    const timeoutMs = this.options.rewardTimeoutMs || 120000;
    let request;
    const pending = new Promise((resolve) => {
      request = { resolve, timeout: null };
      this.pendingReward = request;
      request.timeout = setTimeout(() => {
        if (this.pendingReward !== request) return;
        // Release the UI. Ignore a late close until this ad has finished.
        this.rewardTimedOut = true;
        this.toast("广告等待超时，请稍后重试");
        this._finishReward(false);
      }, timeoutMs);
    });

    Promise.resolve().then(async () => {
      try {
        await ad.show();
      } catch (_) {
        if (this.pendingReward !== request) return;
        try {
          if (!ad.load) throw new Error("ad load unavailable");
          await ad.load();
          if (this.pendingReward !== request) return;
          await ad.show();
        } catch (error) {
          console.warn("rewarded ad show failed:", error);
          if (this.pendingReward === request) {
            this.toast("广告暂时不可用");
            this._finishReward(false);
          }
        }
      }
    });

    return pending;
  }
}

module.exports = { WeChatPlatform };

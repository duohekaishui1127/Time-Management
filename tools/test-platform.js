const assert = require("node:assert");
const { WeChatPlatform } = require("../src/platform/wechat-platform");

function mockWx(ad) {
  const toasts = [];
  const api = {
    getSystemInfoSync: () => ({ platform: "android", windowWidth: 390, windowHeight: 844, pixelRatio: 2 }),
    getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, safeArea: { top: 0, bottom: 844 } }),
    createRewardedVideoAd: () => ad,
    showToast: ({ title }) => toasts.push(title),
  };
  return { api, toasts };
}

function mockAd(result) {
  let close;
  let error;
  let registrations = 0;
  return {
    onClose(handler) { close = handler; registrations++; },
    onError(handler) { error = handler; },
    show() { close(result); return Promise.resolve(); },
    load() { return Promise.resolve(); },
    get registrations() { return registrations; },
    close(resultValue) { close(resultValue); },
    fail(reason) { error(reason); },
  };
}

async function main() {
  for (const [result, expected] of [
    [{ isEnded: true }, true],
    [{ isEnded: false }, false],
    [undefined, false],
  ]) {
    const ad = mockAd(result);
    const { api } = mockWx(ad);
    global.wx = api;
    const platform = new WeChatPlatform({ rewardedVideoAdUnitId: "adunit-test" });
    assert.equal(await platform.showRewardedVideo(), expected);
    assert.equal(await platform.showRewardedVideo(), expected);
    assert.equal(ad.registrations, 1, "广告回调应只注册一次");
  }

  const retryAd = mockAd({ isEnded: true });
  let shows = 0;
  retryAd.show = () => {
    shows++;
    if (shows === 1) return Promise.reject(new Error("load before show"));
    retryAd.close({ isEnded: true });
    return Promise.resolve();
  };
  global.wx = mockWx(retryAd).api;
  const retryPlatform = new WeChatPlatform({ rewardedVideoAdUnitId: "adunit-test" });
  assert.equal(await retryPlatform.showRewardedVideo(), true);
  assert.equal(shows, 2);

  const rejectedAd = mockAd({ isEnded: true });
  rejectedAd.show = () => Promise.reject(new Error("show failed"));
  rejectedAd.load = () => Promise.reject(new Error("load failed"));
  const rejected = mockWx(rejectedAd);
  global.wx = rejected.api;
  const rejectedPlatform = new WeChatPlatform({ rewardedVideoAdUnitId: "adunit-test" });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await rejectedPlatform.showRewardedVideo(), false);
    assert(rejected.toasts.includes("广告暂时不可用"));
  } finally {
    console.warn = originalWarn;
  }

  const hangingAd = mockAd({ isEnded: true });
  hangingAd.show = () => new Promise(() => {});
  global.wx = mockWx(hangingAd).api;
  const hangingPlatform = new WeChatPlatform({ rewardedVideoAdUnitId: "adunit-test", rewardTimeoutMs: 10 });
  assert.equal(await hangingPlatform.showRewardedVideo(), false);
  assert.equal(hangingPlatform.canOfferRewardedVideo(), false);
  hangingAd.close({ isEnded: true });
  assert.equal(hangingPlatform.canOfferRewardedVideo(), true);

  let shareHandlerRegistered = false;
  global.wx = {
    getSystemInfoSync: () => ({ platform: "android" }),
    showShareMenu: () => { throw new Error("share menu unavailable"); },
    onShareAppMessage: () => { shareHandlerRegistered = true; },
    showToast: () => { throw new Error("toast unavailable"); },
  };
  const partialSharePlatform = new WeChatPlatform({});
  const quietWarn = console.warn;
  console.warn = () => {};
  try {
    assert.doesNotThrow(() => partialSharePlatform.enableShare(() => ({})));
    assert.equal(shareHandlerRegistered, true);
    assert.doesNotThrow(() => partialSharePlatform.toast("测试"));
  } finally {
    console.warn = quietWarn;
  }

  let wrote = false;
  global.wx = {
    getSystemInfoSync: () => ({ platform: "android" }),
    getStorageSync: () => { throw new Error("read failed"); },
    setStorageSync: () => { wrote = true; },
  };
  const storagePlatform = new WeChatPlatform({});
  console.warn = () => {};
  try {
    assert.equal(storagePlatform.getStorage("save"), null);
    assert.equal(storagePlatform.setStorage("save", {}), false);
    assert.equal(wrote, false);
  } finally {
    console.warn = originalWarn;
  }

  global.wx = {
    getSystemInfoSync: () => ({ platform: "android" }),
    showShareMenu: () => { throw new Error("share menu unavailable"); },
    shareAppMessage: () => { throw new Error("share unavailable"); },
    showModal: () => { throw new Error("modal unavailable"); },
    showToast: () => {},
  };
  const optionalPlatform = new WeChatPlatform({});
  console.warn = () => {};
  try {
    assert.doesNotThrow(() => optionalPlatform.enableShare(() => ({})));
    assert.doesNotThrow(() => optionalPlatform.share({ title: "测试" }));
    assert.equal(await optionalPlatform.modal({ title: "测试" }), false);
  } finally {
    console.warn = originalWarn;
  }

  console.log("platform tests: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

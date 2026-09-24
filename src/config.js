module.exports = {
  gameplay: {
    defaultUnlockCount: 3,
    maxTasksPerLevel: 6,
    levelPageSize: 10,
  },

  storage: {
    key: "today_in_time_progress_v2",
    version: 2,
    legacyKeys: ["today_in_time_progress_v1"],
  },

  ads: {
    // 在微信公众平台 -> 流量主 -> 广告管理 创建激励视频广告位后填写。
    rewardedVideoAdUnitId: "",

    // 仅开发者工具生效。真机未配置广告位时绝不会免费解锁。
    devtoolsSimulateRewardedAd: true,
  },
};

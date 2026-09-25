const { level, route } = require("./level-utils");

module.exports = [
  level({
    id: "city_011", stars: [100, 120, 138], chapter: "city", name: "第一班公交", start: "07:00", deadline: "08:00", from: "home", to: "office",
    story: "公交 07:20 才发车。先把钥匙和早餐准备好，别在站牌前白等。",
    locations: { home: "家", bakery: "面包店", stop: "公交站", office: "公司" },
    travel: [route("home", "bakery", 4), route("bakery", "stop", 3), route("home", "stop", 7), route("stop", "office", 15)],
    tasks: [
      { id: "keys", name: "找门钥匙", icon: "🔑", duration: 4, location: "home" },
      { id: "bread", name: "买早餐", icon: "🥐", duration: 5, location: "bakery" },
      { id: "board", name: "刷卡上车", icon: "🚌", duration: 2, location: "stop", availableAfter: "07:20", finishBefore: "07:35" },
    ], perfect: "站台刚好开门，早餐还热着。",
  }),
  level({
    id: "city_012", stars: [100, 140, 154], chapter: "city", name: "暴雨前的伞", start: "07:10", deadline: "08:05", from: "home", to: "office",
    story: "暴雨让便利店去公司的路变慢了。拿伞、取快递，再挑一条不绕的路。",
    locations: { home: "家", mart: "便利店", locker: "快递柜", office: "公司" },
    travel: [route("home", "mart", 5), route("home", "locker", 6), route("mart", "locker", 3), route("mart", "office", 12), route("locker", "office", 9)],
    tasks: [
      { id: "bag", name: "收好电脑", icon: "💻", duration: 4, location: "home" },
      { id: "umbrella", name: "买折叠伞", icon: "☂️", duration: 4, location: "mart" },
      { id: "parcel", name: "取快递", icon: "📦", duration: 3, location: "locker" },
    ],
    events: [{ id: "rain", trigger: { type: "simulation_start" }, message: "雨势加大，便利店门口积水。", actions: [{ type: "modify_travel_time", travelId: "mart_office", delta: 7 }] }],
    perfect: "伞拿到了，积水也绕开了。",
  }),
  level({
    id: "city_013", stars: [100, 125, 138], chapter: "city", name: "换乘口的文件", start: "07:15", deadline: "08:10", from: "home", to: "office",
    story: "地铁换乘前先充值；文件在换乘口取，出站后还要带上访客证。",
    locations: { home: "家", station: "地铁站", interchange: "换乘口", gate: "办公楼门口", office: "办公室" },
    travel: [route("home", "station", 6), route("station", "interchange", 8), route("interchange", "gate", 9), route("gate", "office", 3)],
    tasks: [
      { id: "charge", name: "充值交通卡", icon: "💳", duration: 3, location: "station" },
      { id: "file", name: "领取文件", icon: "📄", duration: 4, location: "interchange", dependsOn: ["charge"] },
      { id: "pass", name: "领取访客证", icon: "🎫", duration: 3, location: "gate", dependsOn: ["file"] },
    ], perfect: "换乘、取件、进门一气呵成。",
  }),
  level({
    id: "city_014", stars: [100, 120, 134], chapter: "city", name: "药房九点开", start: "08:20", deadline: "09:40", from: "home", to: "clinic",
    story: "药房 09:00 开门。路过早餐铺时先填饱肚子，别早到门口干等。",
    locations: { home: "家", bakery: "早餐铺", pharmacy: "药房", clinic: "诊所" },
    travel: [route("home", "bakery", 5), route("home", "pharmacy", 7), route("bakery", "pharmacy", 4), route("bakery", "clinic", 12), route("pharmacy", "clinic", 6)],
    tasks: [
      { id: "insurance", name: "找医保卡", icon: "💳", duration: 7, location: "home" },
      { id: "breakfast", name: "吃早餐", icon: "🥣", duration: 12, location: "bakery", dependsOn: ["insurance"] },
      { id: "medicine", name: "取预订药", icon: "💊", duration: 5, location: "pharmacy", availableAfter: "09:00" },
    ], perfect: "药房开门时你刚好抵达。",
  }),
  level({
    id: "city_015", stars: [100, 134, 150], chapter: "city", name: "生日礼物接力", start: "16:30", deadline: "17:30", from: "home", to: "park",
    story: "先选礼物，再包装，最后带着花去公园。花店 17:10 就关门。",
    locations: { home: "家", shop: "礼品店", wrap: "包装台", florist: "花店", park: "公园" },
    travel: [route("home", "shop", 5), route("shop", "wrap", 2), route("wrap", "florist", 4), route("shop", "florist", 6), route("florist", "park", 7), route("wrap", "park", 11)],
    tasks: [
      { id: "gift", name: "挑生日礼物", icon: "🎁", duration: 8, location: "shop" },
      { id: "wrap", name: "包装礼物", icon: "🎀", duration: 5, location: "wrap", dependsOn: ["gift"] },
      { id: "flowers", name: "买一束花", icon: "💐", duration: 4, location: "florist", finishBefore: "17:10" },
    ], perfect: "礼物和花都在，惊喜准时送达。",
  }),
  level({
    id: "city_016", stars: [100, 110, 130], chapter: "city", name: "单行天桥", start: "07:10", deadline: "08:00", from: "home", to: "office",
    story: "天桥只允许从旧街走向广场。先在旧街办事，再过桥去广场。",
    locations: { home: "家", oldtown: "旧街", plaza: "广场", office: "公司" },
    travel: [route("home", "oldtown", 6), route("oldtown", "plaza", 5, false), route("plaza", "office", 9)],
    tasks: [
      { id: "form", name: "填写申请表", icon: "📝", duration: 5, location: "home" },
      { id: "stamp", name: "旧街盖章", icon: "📮", duration: 6, location: "oldtown" },
      { id: "copy", name: "广场复印", icon: "🖨️", duration: 4, location: "plaza", dependsOn: ["stamp"] },
    ], perfect: "单行路没有让你多走一步。",
  }),
  level({
    id: "city_017", stars: [100, 148, 160], chapter: "city", name: "快递柜倒计时", start: "17:30", deadline: "18:30", from: "home", to: "gym",
    story: "快递柜 18:00 自动退件。换好鞋、买水、取件，再去健身房。",
    locations: { home: "家", mart: "便利店", locker: "快递柜", gym: "健身房" },
    travel: [route("home", "mart", 5), route("home", "locker", 7), route("mart", "locker", 3), route("locker", "gym", 8), route("mart", "gym", 10)],
    tasks: [
      { id: "shoes", name: "换运动鞋", icon: "👟", duration: 6, location: "home" },
      { id: "water", name: "买水", icon: "🥤", duration: 4, location: "mart" },
      { id: "parcel", name: "取运动护腕", icon: "📦", duration: 4, location: "locker", finishBefore: "18:00" },
    ], perfect: "柜门关上前，护腕已经在包里。",
  }),
  level({
    id: "city_018", stars: [100, 150, 160], chapter: "city", name: "门诊三件事", start: "08:00", deadline: "09:00", from: "home", to: "clinic",
    story: "先线上挂号，才能取报告；打印预约单后再到诊所报到。",
    locations: { home: "家", lab: "检验室", kiosk: "自助机", clinic: "诊所" },
    travel: [route("home", "lab", 7), route("home", "kiosk", 8), route("lab", "kiosk", 4), route("lab", "clinic", 10), route("kiosk", "clinic", 6)],
    tasks: [
      { id: "register", name: "线上挂号", icon: "📱", duration: 5, location: "home" },
      { id: "report", name: "取检查报告", icon: "📋", duration: 5, location: "lab", dependsOn: ["register"] },
      { id: "print", name: "打印预约单", icon: "🧾", duration: 3, location: "kiosk", dependsOn: ["register"] },
    ], perfect: "材料齐全，叫号刚好轮到你。",
  }),
  level({
    id: "city_019", stars: [100, 116, 122], chapter: "city", name: "临时改签", start: "12:00", deadline: "12:55", from: "square", to: "station",
    story: "列车临时提前到 12:42。吃饭、存包、取票要重新排顺序。",
    locations: { square: "广场", diner: "小饭馆", storage: "寄存处", kiosk: "取票机", station: "车站" },
    travel: [route("square", "diner", 4), route("square", "storage", 5), route("diner", "storage", 3), route("storage", "kiosk", 4), route("diner", "kiosk", 6), route("kiosk", "station", 5)],
    tasks: [
      { id: "meal", name: "吃午饭", icon: "🍱", duration: 8, location: "diner" },
      { id: "bag", name: "寄存行李", icon: "🧳", duration: 4, location: "storage" },
      { id: "ticket", name: "取车票", icon: "🎟️", duration: 3, location: "kiosk" },
    ],
    events: [{ id: "reschedule", trigger: { type: "simulation_start" }, message: "列车提前发车！", actions: [{ type: "modify_deadline", newDeadline: "12:42" }] }],
    perfect: "改签消息来得急，你的路线更快。",
  }),
  level({
    id: "city_020", stars: [100, 140, 152], chapter: "city", name: "城市接力", start: "07:00", deadline: "08:10", from: "home", to: "office",
    story: "电脑、咖啡、快递、文件、工牌，五件事都不能落。主路还在施工。",
    locations: { home: "家", cafe: "咖啡馆", locker: "快递柜", printer: "打印店", office: "公司" },
    travel: [route("home", "cafe", 5), route("home", "locker", 7), route("cafe", "locker", 3), route("cafe", "printer", 7), route("locker", "printer", 4), route("printer", "office", 8), route("locker", "office", 11)],
    tasks: [
      { id: "laptop", name: "装好电脑", icon: "💻", duration: 4, location: "home" },
      { id: "coffee", name: "取预订咖啡", icon: "☕", duration: 4, location: "cafe" },
      { id: "parcel", name: "取样品", icon: "📦", duration: 4, location: "locker" },
      { id: "print", name: "打印方案", icon: "📄", duration: 5, location: "printer", dependsOn: ["laptop"] },
      { id: "badge", name: "领取工牌", icon: "🪪", duration: 2, location: "office" },
    ],
    events: [{ id: "roadwork", trigger: { type: "simulation_start" }, message: "打印店到公司的路施工。", actions: [{ type: "modify_travel_time", travelId: "printer_office", delta: 5 }] }],
    perfect: "五件事全部到位，还比闹钟快。",
  }),
];

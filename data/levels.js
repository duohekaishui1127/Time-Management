module.exports = {
  "schemaVersion": 1,
  "levels": [
    {
      "id": "college_001",
      "chapter": "college",
      "name": "第一次早八",
      "story": "08:00 前到教室。第一关只需要理解：任务顺序会决定你什么时候出发。",
      "timeline": {
        "start": "07:20"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_classroom",
          "from": "dorm",
          "to": "classroom",
          "duration": 15
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "刷牙洗脸",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "dress",
          "name": "换衣服",
          "icon": "👕",
          "duration": 5,
          "location": "dorm"
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "failureBase": 50,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "violationPenalty": 50,
        "starThresholds": [
          100,
          115,
          130
        ]
      },
      "resultTexts": {
        "success": "顺利赶上早八。下一关开始，顺序就不会这么随便了。",
        "good": "很从容，还可以继续压缩一点时间。",
        "perfect": "第一次早八，居然一点都不慌。"
      }
    },
    {
      "id": "college_002",
      "chapter": "college",
      "name": "早餐和咖啡",
      "story": "08:00 前到教室。早餐和咖啡都要拿上，但路线怎么走会影响到达时间。",
      "timeline": {
        "start": "07:20"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "coffee",
          "name": "咖啡店"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_coffee",
          "from": "dorm",
          "to": "coffee",
          "duration": 7
        },
        {
          "id": "canteen_coffee",
          "from": "canteen",
          "to": "coffee",
          "duration": 3
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 8
        },
        {
          "id": "coffee_classroom",
          "from": "coffee",
          "to": "classroom",
          "duration": 5
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "买早餐",
          "icon": "🥪",
          "duration": 5,
          "location": "canteen"
        },
        {
          "id": "coffee_task",
          "name": "买咖啡",
          "icon": "☕",
          "duration": 4,
          "location": "coffee"
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          108,
          116
        ]
      },
      "resultTexts": {
        "success": "赶上了，但路线还可以更顺。",
        "good": "早餐咖啡都拿上了，还没迟到。",
        "perfect": "顺路的艺术。"
      }
    },
    {
      "id": "college_003",
      "chapter": "college",
      "name": "打印店还没开门",
      "story": "打印作业后再去教室。打印店 07:40 才开门，太早到只会在门口干等。",
      "timeline": {
        "start": "07:20"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_print",
          "from": "dorm",
          "to": "print_shop",
          "duration": 5
        },
        {
          "id": "canteen_print",
          "from": "canteen",
          "to": "print_shop",
          "duration": 3
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 7
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 9
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "吃早餐",
          "icon": "🍞",
          "duration": 7,
          "location": "canteen"
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 6,
          "location": "print_shop",
          "availableAfter": "07:40"
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 3,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          106,
          111
        ]
      },
      "resultTexts": {
        "success": "到了，但在门口等人的滋味不太好。",
        "good": "基本没浪费时间。",
        "perfect": "刚好踩着打印店开门时间到。"
      }
    },
    {
      "id": "college_004",
      "chapter": "college",
      "name": "作业还没写完",
      "story": "补完题、导出 PDF、打印，再去教室。顺序错了会直接卡住。",
      "timeline": {
        "start": "07:10"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_print",
          "from": "dorm",
          "to": "print_shop",
          "duration": 7
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 8
        },
        {
          "id": "dorm_classroom",
          "from": "dorm",
          "to": "classroom",
          "duration": 14
        }
      ],
      "tasks": [
        {
          "id": "finish_homework",
          "name": "补最后两道题",
          "icon": "✍️",
          "duration": 10,
          "location": "dorm"
        },
        {
          "id": "export_pdf",
          "name": "导出 PDF",
          "icon": "💾",
          "duration": 2,
          "location": "dorm",
          "dependsOn": [
            "finish_homework"
          ]
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 6,
          "location": "print_shop",
          "dependsOn": [
            "export_pdf"
          ]
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "violationPenalty": 100,
        "starThresholds": [
          100,
          118,
          134
        ]
      },
      "resultTexts": {
        "success": "流程正确，作业也带上了。",
        "good": "顺序没问题，时间也比较稳。",
        "perfect": "作业流水线大师。"
      }
    },
    {
      "id": "college_005",
      "chapter": "college",
      "name": "顺路到底有多重要",
      "story": "早餐、打印、取资料都必须完成。相同的任务，不同路线可能差很多分钟。",
      "timeline": {
        "start": "07:15"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "library",
          "name": "图书馆"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_library",
          "from": "dorm",
          "to": "library",
          "duration": 9
        },
        {
          "id": "canteen_print",
          "from": "canteen",
          "to": "print_shop",
          "duration": 3
        },
        {
          "id": "print_library",
          "from": "print_shop",
          "to": "library",
          "duration": 4
        },
        {
          "id": "library_classroom",
          "from": "library",
          "to": "classroom",
          "duration": 4
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 9
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 7
        }
      ],
      "tasks": [
        {
          "id": "breakfast",
          "name": "买早餐",
          "icon": "🥪",
          "duration": 5,
          "location": "canteen"
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 5,
          "location": "print_shop"
        },
        {
          "id": "materials",
          "name": "取课程资料",
          "icon": "📚",
          "duration": 4,
          "location": "library"
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          114,
          124
        ]
      },
      "resultTexts": {
        "success": "没迟到，但你可能绕了点路。",
        "good": "路线已经比较顺。",
        "perfect": "一条路线解决所有事情。"
      }
    },
    {
      "id": "college_006",
      "chapter": "college",
      "name": "吃完饭别马上跑",
      "story": "吃完早餐后至少休息 10 分钟，才能去完成晨跑打卡。别让空等时间拖垮你的计划。",
      "timeline": {
        "start": "06:55"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "track",
          "name": "操场"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_track",
          "from": "dorm",
          "to": "track",
          "duration": 6
        },
        {
          "id": "canteen_track",
          "from": "canteen",
          "to": "track",
          "duration": 5
        },
        {
          "id": "track_classroom",
          "from": "track",
          "to": "classroom",
          "duration": 8
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 10
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "吃早餐",
          "icon": "🍳",
          "duration": 8,
          "location": "canteen"
        },
        {
          "id": "run",
          "name": "晨跑打卡",
          "icon": "🏃",
          "duration": 12,
          "location": "track",
          "dependsOn": [
            "breakfast"
          ],
          "minGapAfter": [
            {
              "taskId": "breakfast",
              "minutes": 10
            }
          ]
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 1,
        "waitingPenaltyPerMinute": 3,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          108,
          116
        ]
      },
      "resultTexts": {
        "success": "完成了晨跑，但等待时间还可以安排得更聪明。",
        "good": "休息和赶路的节奏不错。",
        "perfect": "把必要等待变成了有效安排。"
      }
    },
    {
      "id": "college_007",
      "chapter": "college",
      "name": "今天电梯坏了",
      "story": "计划看起来很充裕，但开始执行时你会收到一个坏消息。",
      "timeline": {
        "start": "07:15"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_classroom",
          "from": "dorm",
          "to": "classroom",
          "duration": 13
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 9
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "早餐",
          "icon": "🥛",
          "duration": 7,
          "location": "canteen"
        },
        {
          "id": "review",
          "name": "看一遍课堂笔记",
          "icon": "📝",
          "duration": 8,
          "location": "dorm"
        }
      ],
      "events": [
        {
          "id": "elevator_broken",
          "trigger": {
            "type": "simulation_start"
          },
          "actions": [
            {
              "type": "modify_travel_time",
              "travelId": "dorm_canteen",
              "delta": 4
            },
            {
              "type": "modify_travel_time",
              "travelId": "dorm_classroom",
              "delta": 4
            }
          ],
          "message": "宿舍电梯维修，下楼额外需要 4 分钟。"
        }
      ],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          108,
          116
        ]
      },
      "resultTexts": {
        "success": "计划赶不上变化，但你还是到了。",
        "good": "电梯坏了也没把你拖垮。",
        "perfect": "真正的时间管理，是给意外留余量。"
      }
    },
    {
      "id": "college_008",
      "chapter": "college",
      "name": "室友让我带份饭",
      "story": "早餐、打印作业、帮室友带饭都要完成。顺序不好，友情和早八只能保一个。",
      "timeline": {
        "start": "07:10"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_print",
          "from": "dorm",
          "to": "print_shop",
          "duration": 7
        },
        {
          "id": "canteen_print",
          "from": "canteen",
          "to": "print_shop",
          "duration": 3
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 7
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 9
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "自己吃早餐",
          "icon": "🥪",
          "duration": 5,
          "location": "canteen"
        },
        {
          "id": "roommate_food",
          "name": "给室友带饭",
          "icon": "🍱",
          "duration": 4,
          "location": "canteen"
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 6,
          "location": "print_shop"
        }
      ],
      "events": [],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 2,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 10,
        "starThresholds": [
          100,
          108,
          116
        ]
      },
      "resultTexts": {
        "success": "作业带了，饭也带了，人也到了。",
        "good": "友情和学业暂时都保住了。",
        "perfect": "中国好室友，还是时间管理大师。"
      }
    },
    {
      "id": "college_009",
      "chapter": "college",
      "name": "老师提前点名",
      "story": "原本 08:00 上课，但开始执行时班群突然弹出一条消息……",
      "timeline": {
        "start": "07:10"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_print",
          "from": "dorm",
          "to": "print_shop",
          "duration": 7
        },
        {
          "id": "canteen_print",
          "from": "canteen",
          "to": "print_shop",
          "duration": 3
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 7
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 9
        }
      ],
      "tasks": [
        {
          "id": "wash",
          "name": "洗漱",
          "icon": "🪥",
          "duration": 5,
          "location": "dorm"
        },
        {
          "id": "breakfast",
          "name": "早餐",
          "icon": "🥪",
          "duration": 6,
          "location": "canteen"
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 6,
          "location": "print_shop"
        }
      ],
      "events": [
        {
          "id": "early_roll_call",
          "trigger": {
            "type": "simulation_start"
          },
          "actions": [
            {
              "type": "modify_deadline",
              "newDeadline": "07:50"
            }
          ],
          "message": "班群：老师说今天 07:50 提前点名。"
        }
      ],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 3,
        "waitingPenaltyPerMinute": 2,
        "latePenaltyPerMinute": 12,
        "starThresholds": [
          100,
          106,
          112
        ]
      },
      "resultTexts": {
        "success": "提前点名也没抓到你。",
        "good": "很险，但稳住了。",
        "perfect": "老师提前点名，你提前到了。"
      }
    },
    {
      "id": "college_010",
      "chapter": "college",
      "name": "地狱早八",
      "story": "第一章 Boss：打印店有开放时间，路线复杂，还会下雨。把前九关学到的东西全用上。",
      "timeline": {
        "start": "07:00"
      },
      "startLocation": "dorm",
      "goal": {
        "deadline": "08:00",
        "endLocation": "classroom"
      },
      "locations": [
        {
          "id": "dorm",
          "name": "宿舍"
        },
        {
          "id": "canteen",
          "name": "食堂"
        },
        {
          "id": "print_shop",
          "name": "打印店"
        },
        {
          "id": "parcel",
          "name": "快递站"
        },
        {
          "id": "classroom",
          "name": "教学楼"
        }
      ],
      "travel": [
        {
          "id": "dorm_canteen",
          "from": "dorm",
          "to": "canteen",
          "duration": 4
        },
        {
          "id": "dorm_print",
          "from": "dorm",
          "to": "print_shop",
          "duration": 6
        },
        {
          "id": "canteen_print",
          "from": "canteen",
          "to": "print_shop",
          "duration": 3
        },
        {
          "id": "print_parcel",
          "from": "print_shop",
          "to": "parcel",
          "duration": 4
        },
        {
          "id": "canteen_parcel",
          "from": "canteen",
          "to": "parcel",
          "duration": 7
        },
        {
          "id": "parcel_classroom",
          "from": "parcel",
          "to": "classroom",
          "duration": 7
        },
        {
          "id": "print_classroom",
          "from": "print_shop",
          "to": "classroom",
          "duration": 8
        },
        {
          "id": "canteen_classroom",
          "from": "canteen",
          "to": "classroom",
          "duration": 10
        }
      ],
      "tasks": [
        {
          "id": "finish_homework",
          "name": "补最后一道题",
          "icon": "✍️",
          "duration": 7,
          "location": "dorm"
        },
        {
          "id": "export_pdf",
          "name": "导出 PDF",
          "icon": "💾",
          "duration": 2,
          "location": "dorm",
          "dependsOn": [
            "finish_homework"
          ]
        },
        {
          "id": "breakfast",
          "name": "吃早餐",
          "icon": "🍳",
          "duration": 6,
          "location": "canteen"
        },
        {
          "id": "print",
          "name": "打印作业",
          "icon": "🖨️",
          "duration": 6,
          "location": "print_shop",
          "dependsOn": [
            "export_pdf"
          ],
          "availableAfter": "07:25"
        },
        {
          "id": "parcel_task",
          "name": "取快递",
          "icon": "📦",
          "duration": 5,
          "location": "parcel",
          "availableAfter": "07:20"
        }
      ],
      "events": [
        {
          "id": "rain",
          "trigger": {
            "type": "simulation_start"
          },
          "actions": [
            {
              "type": "modify_travel_time",
              "travelId": "dorm_canteen",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "dorm_print",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "canteen_print",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "print_parcel",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "canteen_parcel",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "parcel_classroom",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "print_classroom",
              "delta": 1
            },
            {
              "type": "modify_travel_time",
              "travelId": "canteen_classroom",
              "delta": 1
            }
          ],
          "message": "今天下雨，所有室外移动都变慢了。"
        },
        {
          "id": "boss_deadline",
          "trigger": {
            "type": "simulation_start"
          },
          "actions": [
            {
              "type": "modify_deadline",
              "newDeadline": "07:55"
            }
          ],
          "message": "老师通知：07:55 开始点名。"
        }
      ],
      "scoring": {
        "successBase": 100,
        "earlyBonusPerMinute": 3,
        "waitingPenaltyPerMinute": 3,
        "latePenaltyPerMinute": 15,
        "violationPenalty": 100,
        "starThresholds": [
          100,
          106,
          112
        ]
      },
      "resultTexts": {
        "success": "地狱早八，低空飞过。",
        "good": "下雨、打印、快递都没拦住你。",
        "perfect": "这不是时间管理，这是路线规划艺术。"
      }
    }
  ]
};

module.exports.levels = module.exports.levels.concat(
  require("./city-levels"),
  require("./work-levels"),
  require("./travel-levels")
);

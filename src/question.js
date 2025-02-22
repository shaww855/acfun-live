import inquirer from "inquirer";
import { defaultConfig, saveConfig } from "./userConfig.js";

const questionList = [
  {
    type: "list",
    name: "引导方式",
    message: "您似乎是第一次运行，请选择引导方式",
    choices: ["快速", "进阶"],
    default: "快速",
  },
  {
    type: "input",
    name: "白名单",
      message: "你是单推吗？请输入uid（例：123,456）",
    validate(input) {
      return validateUid(input);
    },
  },
  {
    type: "input",
    name: "黑名单",
    message: "有不想看的主播吗？请输入uid（例：654,321）",
    when (answers) {
      return answers.白名单.trim() === ''
    },
    validate(input) {
      return validateUid(input);
    },
  },
  {
    type: "confirm",
    name: "记住登录状态",
    message: "记住登录状态（约30天内无需重复登录）",
    default: true,
    when(answers) {
      return answers.引导方式 == "进阶";
    },
  },
  {
    type: "confirm",
    name: "忽略有牌子但未关注的直播间",
    message: "忽略有牌子但未关注的直播间",
    default: false,
    when(answers) {
      return answers.引导方式 == "进阶";
    },
  },
  {
    type: "input",
    name: "浏览器路径",
    message: "请输入浏览器执行文件路径",
    default: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    when(answers) {
      return answers.引导方式 == "进阶" && global.platformIsWin;
    },
  },
];

export function makeUserConfig() {
  return inquirer.prompt(questionList).then((answers) => {
    // console.log(answers);

    try {
      if (answers.白名单.trim() !== "") {
        answers.白名单 = answers.白名单.split(",");
      } else {
        answers.白名单 = [];
      }
    } catch (error) {
      console.error(error);
      answers.白名单 = [];
      console.log("整理白名单失败，将留空");
    }

    try {
      if (answers.黑名单.trim() !== "") {
        answers.黑名单 = answers.黑名单.split(",");
      } else {
        answers.黑名单 = [];
      }
    } catch (error) {
      console.error(error);
      answers.黑名单 = [];
      console.log("整理黑名单失败，将留空");
    }

    delete answers.引导方式;
    global.config = {
      ...defaultConfig,
      ...answers,
    };
    saveConfig();
  });
}

function validateUid(input) {
  if (input.trim() == "") {
    return true;
  }
  if (/^(\d+[-,]?)*\d+$/g.test(input)) {
    return true;
  }

  return "请输入以英文逗号分隔的uid文本";
}

import log4js from "log4js";

log4js.configure({
  appenders: {
    console: { type: "console" },
    dateFileOut: {
      type: "dateFile",
      filename: "logs/datefile.log",
      pattern: "yyyy-MM-dd.log",
      maxLogSize: 10485760,
      backups: 3,
      alwaysIncludePattern: true,
    },
  },

  categories: {
    default: { appenders: ["dateFileOut"], level: "all" },
    acfunlive: { appenders: ["console", "dateFileOut"], level: "info" },
  },
});
const logger = log4js.getLogger("acfunlive");

logger.debug("debugdebugdebugdebug");
export default logger;
export async function shutdown() {
  return Promise.then((resolve) => {
    log4js.shutdown(() => {
      resolve();
    });
  });
}

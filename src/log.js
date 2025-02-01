import * as winston from "winston";
import "winston-daily-rotate-file";

const transport = new winston.transports.DailyRotateFile({
  dirname: "logs",
  filename: "%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "7d",
});

transport.on("error", (error) => {
  // log or handle errors here
});

transport.on("rotate", (oldFilename, newFilename) => {
  // do something fun
});

global.logger = winston.createLogger({
  transports: [transport],
});

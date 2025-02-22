import moment from "moment";
import * as winston from "winston";
import "winston-daily-rotate-file";
const { combine, timestamp, label, printf } = winston.format;

const transport = new winston.transports.DailyRotateFile({
  dirname: "logs",
  filename: "%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "7d",
});

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${moment(timestamp).format("YYYY-MM-DD HH:mm:ss")} [${level}] ${message}`;
});

transport.on("error", (error) => {
  // log or handle errors here
});

transport.on("rotate", (oldFilename, newFilename) => {
  // do something fun
});

global.logger = winston.createLogger({
  format: combine(timestamp(), myFormat),
  transports: [transport],
});

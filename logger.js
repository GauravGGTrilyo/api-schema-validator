const { createLogger, format, transports, addColors } = require("winston");
const { colorize, combine, label, printf, timestamp, simple } = format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

/**
 * @commented for reference​
const logLevels = {
levels: {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  sql: 4,
  debug: 5
},
colors: {
  error: "red",
  warn: "darkred",
  info: "black",
  http: "green",
  sql: "blue",
  debug: "gray"
}
};
addColors(logLevels);
*/
const transportArr = [
    new transports.Console({level: process.env.SCHEMA_PRINT_MODE == "debug" ? 'debug' : 'warn'}),
    new transports.File({filename: 'errors.log', level: 'error'}),
    new transports.File({ filename: 'combined.log', level:'warn' }),
];
const logger = createLogger({
  levels:{
    error: 0,
    info: 1,
    warn: 2,
    debug: 3
  },
  format: combine(
    timestamp(),
    colorize(),
    myFormat
  ),
  transports: transportArr
});

let ExtendedLogger = function(functionNameSpace, req) {
  let url = "";
  if (!req) {
    req = {};
    req.method = "func";
    url = "_" + functionNameSpace
  } else {
    url = req.originalUrl.split("?")[0];
  }

  const _createMessage = (args) => {
    let messageLocal = [];
    args.map((arg) => {

      if (arg instanceof Object) {
        messageLocal.push(JSON.stringify(arg, null, 4));
      } else {
        messageLocal.push(arg);
      }

    });

    return messageLocal.join("    ");
  }

  this.warn = function(...args) {
    if(process.env.NODE_ENV == "test") { return; }
    let messageLocal = _createMessage(args);

    logger.log({
      "level"   : "warn",
      "message" : messageLocal,
      "label"   : req.method.toLowerCase() + "." + url.replace(/\//gi, ".").substring(1)
    })
  }
  this.error = function(...args) {
    if(process.env.NODE_ENV == "test") { return; }
    let messageLocal = _createMessage(args);

    logger.log({
      "level"   : "error",
      "message" : messageLocal,
      "label"   : req.method.toLowerCase() + "." + url.replace(/\//gi, ".").substring(1)
    })
  }
  this.log = function(...args) {
    if(process.env.NODE_ENV == "test") { return; }
    let messageLocal = _createMessage(args);

    logger.log({
      "level"   : "info",
      "message" : messageLocal,
      "label"   : req.method.toLowerCase() + "." + url.replace(/\//gi, ".").substring(1)
    });
  }
  this.debug = function(...args) {
    if(process.env.NODE_ENV == "test") { return; }
    // if (process.env.SCHEMA_PRINT_MODE == "debug") {

    // }
    let messageLocal = _createMessage(args);
      logger.log({
        "level"   : "debug",
        "message" : messageLocal,
        "label"   : req.method.toLowerCase() + "." + url.replace(/\//gi, ".").substring(1)
      });
  }
}

module.exports = {logger, ExtendedLogger};

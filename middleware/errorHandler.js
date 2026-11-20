import fs from "fs";
import { view } from "../utils/helpers.js";

function logError(err, req) {
  const line = `[${new Date().toISOString()}] ${req.method} ${
    req.originalUrl
  } ${req?.session?.userId} - ${err.stack || err.message}\n\n`;

  fs.appendFile("error.log", line, (writeErr) => {
    if (writeErr) return console.error("Failed to write error log:", writeErr);
  });
}

const errorHandler = (err, req, res, next) => {
  // logError(err, req);
  console.log(err);
  if (req.headers["Content-Type"] == "application/json") {
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
  res.sendFile(view("error.html"));
};

export default errorHandler;

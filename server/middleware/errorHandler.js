import fs from "fs";

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
  res.status(500).json({
    success: false,
    message: "something went wrong",
  });
};

export default errorHandler;

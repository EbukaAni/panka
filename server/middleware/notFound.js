import { fileURLToPath } from "url";
import path from "path";
import { view } from "../utils/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notFound = (req, res, next) => {
  if (req.headers["Content-Type"] == "application/json") {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404).json({ error });
  }
  return res.status(404).sendFile(view("notfound.html"));
};

export default notFound;

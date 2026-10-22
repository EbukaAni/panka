import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function view(view) {
  return path.join(__dirname, "../", "view", view);
}

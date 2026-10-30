import "dotenv/config";
import { defineConfig } from "prisma/config";

const user = process.env.DB_USER;
const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const database = process.env.DB_NAME;

const DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}?ssl-mode=REQUIRED&connect_timeout=30`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.js",
  },
  datasource: {
    url: DATABASE_URL,
  },
});

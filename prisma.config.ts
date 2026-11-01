import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

const isProd = true;

dotenv.config({
  path: path.resolve(process.cwd(), isProd ? ".env" : ".env.local"),
});

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

const DATABASE_URL = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD || "")}@${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl-mode=REQUIRED&connect_timeout=30`;

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

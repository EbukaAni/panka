import "dotenv/config";
import { defineConfig } from "prisma/config";

const user = process.env.DB_USER;
const password = encodeURIComponent(process.env.DB_PASSWORD);
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const database = process.env.DB_NAME;

const DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});

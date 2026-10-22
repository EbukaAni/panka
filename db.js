import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { decrypt, encrypt } from "./utils/encyption.js";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
  connectionLimit: 20,
  connectTimeout: 15000,
  acquireTimeout: 30000,
});

export const basePrisma = new PrismaClient({
  adapter,
});

export const prisma = basePrisma.$extends({
  query: {
    mailSendToken: {
      async upsert({ args, query }) {
        if (args.create?.refreshToken) {
          args.create.refreshToken = encrypt(args.create.refreshToken);
        }
        if (args.create.accessToken) {
          args.create.accessToken = encrypt(args.create.accessToken);
        }

        if (args.update?.refreshToken) {
          args.update.refreshToken = encrypt(args.update.refreshToken);
        }
        if (args.update?.accessToken) {
          args.update.accessToken = encrypt(args.update.accessToken);
        }

        return query(args);
      },
    },
    user: {
      async findFirst({ args, query }) {
        if (args.where) args.where.status = "ACTIVE";
        return query(args);
      },
    },
  },
  result: {
    mailSendToken: {
      accessToken: {
        needs: { accessToken: true },
        compute(mailsendToken) {
          return decrypt(mailsendToken.accessToken);
        },
      },
      refreshToken: {
        needs: { refreshToken: true },
        compute(mailsendToken) {
          return decrypt(mailsendToken.refreshToken);
        },
      },
    },
  },
});

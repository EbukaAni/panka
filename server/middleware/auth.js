import session from "express-session";
import MySQLStore from "express-mysql-session";
import mysql from "mysql2/promise";
import { prisma } from "../db.js";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  connectionLimit: 10,
  waitForConnections: true,
});

const Store = MySQLStore(session);

const sessionStore = new Store({}, pool);

export const authSession = session({
  key: "session_cookie",
  secret: process.env.SESSION_SECRET || "",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

export function ensureIsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }
  if (req.headers["content-type"] !== "application/json") {
    return res.redirect("/");
  }
  res.status(401).json({ message: "unauthorized" });
}

export async function authorizeRecurring(req, res, next) {
  const recur = await prisma.recurringInvoice.findFirst({
    where: { id: Number(req.params.id) },
    select: { userId: true },
  });
  if (req.user.id !== recur?.userId) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
}

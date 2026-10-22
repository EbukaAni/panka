import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "../db.js";

const store = new PrismaSessionStore(prisma, {
  checkPeriod: 60 * 60 * 1000,
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
});

export const authSession = session({
  key: "session_cookie",
  secret: process.env.SESSION_SECRET || "",
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 1,
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

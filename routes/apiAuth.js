import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";
import express from "express";

const authRouter = express.Router();
const publicRouter = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");
const newRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const signAccess = (user) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1hr" });

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function issueTokens(user, familyId = crypto.randomUUID(), tx = prisma) {
  const refreshToken = newRefreshToken();
  await tx.refreshToken.create({
    data: {
      tokenHash: hash(refreshToken),
      userId: user.id,
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { accessToken: signAccess(user), refreshToken };
}

publicRouter.post("/auth/refresh", express.json(), async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Missing token" });

  const tokenHash = hash(refreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record || record.expiresAt < new Date()) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  try {
    const tokens = await prisma.$transaction(async (tx) => {
      // Atomically claim the token: only succeeds if it's still unused
      const claimed = await tx.refreshToken.updateMany({
        where: { tokenHash, used: false },
        data: { used: true, usedAt: new Date() },
      });

      if (claimed.count === 0) throw new Error("REUSED");

      return issueTokens(record.userId, record.familyId, tx);
    });

    res.json(tokens);
  } catch (e) {
    if (e.message === "REUSED") {
      // Revoke the whole family
      await prisma.refreshToken.deleteMany({
        where: { familyId: record.familyId },
      });
      return res.status(401).json({ error: "Token reuse detected" });
    }
    throw e;
  }
});

authRouter.post("/auth/logout", express.json(), async (req, res) => {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash(req.body.refreshToken || "") },
  });
  if (record) {
    await prisma.refreshToken.deleteMany({
      where: { familyId: record.familyId },
    });
  }
  res.json({ ok: true });
});

publicRouter.post("/auth/google", express.json(), async (req, res) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub, email, email_verified, name, picture } = ticket.getPayload();
    if (!email_verified)
      return res.status(401).json({ error: "Email not verified" });

    let user = await prisma.user.findFirst({
      where: { googleId: sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          name,
          email,
          picture,
          status: "ACTIVE",
        },
        select: { id: true, googleId: true, name: true, email: true },
      });
      mailer.send(
        Messages.welcome({
          to: email,
          name,
        }),
      );
    }

    const tokens = await issueTokens({ id: user.id, email: user.email });
    res.json(tokens);
  } catch (e) {
    console.log(e);
    res.status(401).json({ error: "Invalid token" });
  }
});

export { publicRouter, authRouter };

import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  (req, _, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed",
    failureMessage: true,
    keepSessionInfo: true,
  }),
  (req, res) => {
    const redirectTo = req.session.returnTo || "/account/dashboard";
    delete req.session.returnTo;
    res.redirect(safeRedirect(redirectTo));
  },
);

// Logout
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

router.get("/login-failed", (req, res) => {
  res.status(401).send("Google sign-in failed. Please try again.");
});

function safeRedirect(url, fallback = "/") {
  if (typeof url !== "string") return fallback;
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) {
    return fallback;
  }
  return url;
}

export default router;

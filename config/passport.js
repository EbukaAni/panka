import passport from "passport";
import { prisma } from "../db.js";
import Strategy from "passport-google-oauth20";

const GoogleStrategy = Strategy.Strategy;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findFirst({
          where: { googleId: profile.id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              picture: profile.photos?.[0]?.value,
              status: "ACTIVE",
              subscription: {
                create: {
                  plan: { connect: { name: "free" } },
                  status: "ACTIVE",
                  startDate: new Date(),
                },
              },
            },
            select: { id: true, googleId: true, name: true, email: true },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId, done) => {
  const user = await prisma.user.findFirst({
    where: { googleId },
  });

  done(null, user || null);
});

export default passport;

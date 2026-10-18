import { google } from "googleapis";
import { prisma } from "../db.js";

export const authorize = async (req, res) => {
  const { code, redirectUri } = req.body;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const {
    tokens: { access_token, refresh_token, scope },
  } = await oauth2Client.getToken({ code });

  const options = {
    accessToken: access_token,
    refreshToken: refresh_token,
    scopes: scope.split(" "),
    user: {
      connect: { id: req.user.id },
    },
  };

  const { scopes } = await prisma.mailSendToken.upsert({
    where: { userId: req.user.id },
    create: options,
    update: options,
  });
  res.json({ accessScopes: scopes });
};

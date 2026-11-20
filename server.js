import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { webhooks, BachsWebhookError } from "@bachs/sdk";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import apiRoute from "./routes/apiRoutes.js";
import { ensureIsAuthenticated, authSession } from "./middleware/auth.js";
import { fileURLToPath } from "url";
import path from "path";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import { view } from "./utils/helpers.js";
import subscriptionController from "./controllers/subscriptionController.js";
import { prisma } from "./db.js";
import ledgerController from "./controllers/ledgerController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) app.set("trust proxy", 1);

app.use(
  cors({
    credentials: true,
    origin: [process.env.EXTENSION_ORIGIN],
  }),
);
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => {
  res.sendFile(view("home.html"));
});
app.get("/login", (_, res) => {
  res.sendFile(view("login.html"));
});
app.get("/privacy-policy", (_, res) => {
  res.sendFile(view("privacy-policy.html"));
});
app.get("/subscription/success", (_, res) => {
  res.sendFile(view("success.html"));
});
app.post(
  "/webhooks/bachs",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;
    try {
      event = webhooks.constructEvent(
        req.body,
        req.headers,
        process.env.BACHS_WEBHOOK_SECRET,
      );
      const result = await prisma.webhookEvent.findFirst({
        where: { id: event.id },
      });
      if (result) return res.sendStatus(200);
      switch (event.type) {
        case "customer.subscription.created":
          await withEvent(() => subscriptionController.create(event), event.id);
          break;
        case "customer.subscription.updated":
          if (event.data["cancel_at_period_end"]) {
            await withEvent(
              () => subscriptionController.cancel(event),
              event.id,
            );
          }
          break;
        case "invoice.paid":
          await withEvent(() => ledgerController.create(event), event.id);
          break;
        default:
          break;
      }

      return res.sendStatus(200);
    } catch (err) {
      if (err instanceof BachsWebhookError) {
        return res.sendStatus(400);
      }
      console.error("Webhook processing failed", event.id, err);
      return res.sendStatus(500);
    }
  },
);

async function withEvent(fn, id) {
  await fn();
  await prisma.webhookEvent.create({ data: { id } });
}

app.use(authSession);

app.use(passport.initialize());
app.use(passport.session());

app.get("/subscribe", subscriptionController.subscribe);
app.use("/auth", authRoutes);
app.use("/uploads", ensureIsAuthenticated, express.static("uploads"));

app.use("/api", apiRoute);
if (isProduction) {
  app.get("/dashboard", ensureIsAuthenticated, (_, res) => {
    return res.sendFile(path.join(__dirname, "client/dist/index.html"));
  });
  app.use(notFound);
} else {
  app.use(
    "/",
    ensureIsAuthenticated,
    createProxyMiddleware({
      target: "http://localhost:5174",
      changeOrigin: true,
      ws: true, // needed for Vite's HMR websocket
    }),
  );
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`,
  );
});

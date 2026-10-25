import express from "express";
import cors from "cors";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
const devClientUrl = "http://localhost:5173";

if (isProduction) app.set("trust proxy", 1);

app.use(
  cors({
    credentials: true,
    origin: [process.env.EXTENSION_ORIGIN, !isProduction ? devClientUrl : null],
  }),
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/assets",
  isProduction
    ? express.static(path.join(__dirname, "client/dist/assets"))
    : (_, res) => {
        res.redirect(devClientUrl);
      },
);

app.get("/", (_, res) => {
  res.sendFile(view("home.html"));
});
app.get("/privacy-policy", (_, res) => {
  res.sendFile(view("privacy-policy.html"));
});

app.use(authSession);

app.use(passport.initialize());
app.use(passport.session());

app.get("/account/dashboard/", ensureIsAuthenticated, (_, res) => {
  if (isProduction) {
    return res.sendFile(path.join(__dirname, "client/dist/index.html"));
  }
  res.redirect(devClientUrl);
});
app.get("/subscribe", subscriptionController.subscribe);
app.use("/auth", authRoutes);
app.use("/uploads", ensureIsAuthenticated, express.static("uploads"));

app.use("/api", apiRoute);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`,
  );
});

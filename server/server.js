import "dotenv/config";
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
import { invoiceErrorHandler } from "./controllers/invoiceController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(authSession);
app.use(
  cors({
    credentials: true,
    origin: [
      "chrome-extension://blipddhjepefmnklllfdeccbcmdnbbfb",
      "http://localhost:5173",
    ],
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets")),
);

app.get("/", (_, res) => {
  res.sendFile(view("home.html"));
});
app.get("/account/dashboard/", ensureIsAuthenticated, (_, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
app.get("/subscribe", subscriptionController.subscribe);
app.use("/auth", authRoutes);
app.use("/uploads", ensureIsAuthenticated, express.static("uploads"));

app.use("/api", apiRoute);
app.use(notFound);
// app.use(invoiceErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`,
  );
});

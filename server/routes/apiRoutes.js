import express from "express";
import {
  authorizeRecurring,
  ensureIsAuthenticated,
} from "../middleware/auth.js";
import userController from "../controllers/userController.js";
import recurringController from "../controllers/RecurringController.js";
import subscriptionController from "../controllers/subscriptionController.js";
import businessController from "../controllers/businessController.js";
import { body, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import {
  hasOauthAccess,
  hasBusinessInfo,
  idempotency,
  validateFields,
  validateUpdateFields,
} from "../middleware/recurringInvoice.js";
import { authorize } from "../controllers/gmailController.js";
import clientController from "../controllers/clientController.js";
import multer from "multer";
import { prisma } from "../db.js";
import dashboardController from "../controllers/dashboardController.js";
import { canAddRecurringInvoice } from "../middleware/canAddRecurrInvoice.js";
import invoiceRoutes from "../routes/invoice.js";
import { invoiceErrorHandler } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: "Invalid token" });

    const { sub, email, name, picture } = await r.json();
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: sub,
          name,
          email,
          picture,
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

    req.session.user = { id: user.id, email: user.email };
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      res.status(201).json({ user });
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Token verification failed" });
  }
});

router.use(ensureIsAuthenticated);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/business/create_or_update",
  upload.single("logo"),
  (req, _, next) => {
    req.body.info = JSON.parse(req.body.info);
    next();
  },
  [
    body(["info.name", "info.email"]).notEmpty(),
    body(["info.phone", "info.address"]).optional({ values: "falsy" }),

    validate,
  ],
  (req, res, next) => {
    if (!req.file) {
      return next();
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        errors: [{ msg: "Invalid file type. Only JPEG, PNG, and JPG allowed" }],
      });
    }
    next();
  },
  businessController.createOrUpdate,
);

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.status(204).end();
    });
  });
});

router.get(
  "/create_subscription",
  [
    query(["status", "tx_ref"])
      .notEmpty()
      .withMessage("this field is required"),
    validate,
  ],
  subscriptionController.createSubscription,
);
router.post("/reactivate-subscription", subscriptionController.activate);
router.get(
  "/update_subscription",
  [
    query(["transaction_id", "tx_ref"])
      .notEmpty()
      .withMessage("this field is required"),
    validate,
  ],
  subscriptionController.updateSubscription,
);
router.post("/cancel_subscription", subscriptionController.cancelSubscription);
router.get("/dashboard/data", dashboardController.getData);
router.get("/user", userController.find);
router.delete("/user", userController.deleteUser);

router.get("/recurring", recurringController.index);
router.get("/recurring/:id", authorizeRecurring, recurringController.find);
router.delete("/recurring/:id", authorizeRecurring, recurringController.remove);
router.post(
  "/recurring/:id/pause",
  authorizeRecurring,
  recurringController.pause,
);
router.post(
  "/recurring/:id/resume",
  authorizeRecurring,
  recurringController.resume,
);
router.post(
  "/recurring",
  canAddRecurringInvoice,
  idempotency,
  hasBusinessInfo,
  hasOauthAccess,
  validateFields,
  recurringController.create,
);
router.patch(
  "/recurring/:id",
  authorizeRecurring,
  hasBusinessInfo,
  validateUpdateFields,
  recurringController.update,
);
router.post(
  "/clients/create_or_update",
  [
    body(["name", "email"]).notEmpty(),
    body(["phone", "address"]).optional({ values: "falsy" }),
    validate,
  ],
  clientController.createOrUpdate,
);
router.delete("/clients/:clientId", clientController.remove);
router.post("/gmail/authorize", authorize);

router.use("/invoices", invoiceRoutes);

router.get("/business/:id", businessController.find);

export default router;

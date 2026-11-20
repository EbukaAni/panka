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
import dashboardController from "../controllers/dashboardController.js";
import { canAddRecurringInvoice } from "../middleware/canAddRecurrInvoice.js";
import invoiceRoutes from "../routes/invoice.js";
import { prisma } from "../db.js";
import { authRouter, publicRouter } from "./apiAuth.js";

const router = express.Router();

router.use(publicRouter);

router.use(ensureIsAuthenticated);

router.use(authRouter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  "/business",
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
  businessController.create,
);
router.post(
  "/business/:id",
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
  businessController.update,
);

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/subscription", async (req, res) => {
  const params = req.query;
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    ...(params.include && { include: { [params.include]: true } }),
  });
  res.json(sub);
});
router.get(
  "/subscription/create",
  [
    query(["status", "tx_ref"])
      .notEmpty()
      .withMessage("this field is required"),
    validate,
  ],
  subscriptionController.create,
);
router.get("/subscription/status", async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
  });
  if (subscription) {
    return res.json({ status: subscription.status.toLowerCase() });
  }
  return res.sendStatus(409);
});
router.post("/subscription/cancel", subscriptionController.requestCancelation);
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

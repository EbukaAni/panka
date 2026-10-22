import { Router } from "express";
import * as c from "../controllers/invoiceController.js";
import {
  validate,
  idParam,
  listQueryRules,
  createInvoiceRules,
  updateInvoiceRules,
} from "../middleware/invoiceValidators.js";

const router = Router();

router.get("/", listQueryRules, validate, c.getInvoices);
router.post("/", createInvoiceRules, validate, c.createInvoice);
router.get("/stats", c.getStats);
router.get("/:id", idParam, validate, c.getInvoice);
router.patch("/:id", idParam, updateInvoiceRules, validate, c.updateInvoice);
router.delete("/:id", idParam, validate, c.deleteInvoice);
router.post("/:id/mark-as-paid", c.markAPaid);

export default router;

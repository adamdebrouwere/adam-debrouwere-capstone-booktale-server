import express from "express";
import { getTale } from "../controllers/talesController.js";

const router = express.Router();

router.get("/:qr_code_id", getTale);

export default router;

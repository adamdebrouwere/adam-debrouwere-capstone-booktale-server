import express from "express";
import { getUserProfile, getPastTales, postBooktale, postComment } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUserProfile); 
router.get("/:user_id", getPastTales);
router.post("/booktale", postBooktale)
router.post("/:qr_code_id", postComment);


export default router;
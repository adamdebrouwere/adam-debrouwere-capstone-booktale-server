import express from "express";
import { signUpUser, loginUser, userAuthenticated } from "../controllers/authController.js";
import authenticateUser from "../middleware/authenticateUser.js";


const router = express.Router();

router.get("/authenticated", authenticateUser, userAuthenticated)
router.post("/signup", signUpUser);
router.post("/login", loginUser);

export default router;
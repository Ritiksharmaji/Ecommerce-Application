import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);
AuthRouter.get("/me", protect, getMe);

export default AuthRouter;

import express from "express";
import { register, login, getMe, deleteMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", register);
AuthRouter.post("/login", login);
AuthRouter.get("/me", protect, getMe);
AuthRouter.delete("/me", protect, deleteMe);

export default AuthRouter;

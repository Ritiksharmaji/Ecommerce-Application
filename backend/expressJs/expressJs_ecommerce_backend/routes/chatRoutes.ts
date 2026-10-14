import express from "express";
import { chat } from "../controllers/chatController.js";
import { optionalAuth } from "../middleware/auth.js";

const ChatRouter = express.Router();

ChatRouter.post("/", optionalAuth, chat);

export default ChatRouter;

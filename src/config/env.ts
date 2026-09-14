import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: 3000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "lawfirm_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
};

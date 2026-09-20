import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: Number(process.env.PORT) || 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  AI_ENABLED: process.env.AI_ENABLED !== "false",
  SESSION_SECRET: process.env.SESSION_SECRET || "lawfirm_secret",
  BANK_WEBHOOK_SECRET: process.env.BANK_WEBHOOK_SECRET || "",
  BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER || "",
  BANK_ACCOUNT_HOLDER: process.env.BANK_ACCOUNT_HOLDER || "",
  NODE_ENV: process.env.NODE_ENV || "development",
};

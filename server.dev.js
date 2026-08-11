// Local development only. Runs the same serverless handler used in
// production (api/chat.js) behind a small Express server so `npm run dev`
// + `npm run server` can be used together without deploying to Vercel.
// In production, Vercel (or your platform of choice) invokes api/chat.js
// directly and this file is not used.
import "dotenv/config";
import express from "express";
import cors from "cors";
import chatHandler from "./api/chat.js";

const app = express();
app.use(cors());
app.use(express.json());

app.all("/api/chat", (req, res) => chatHandler(req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stacy API dev server running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY is not set. Add it to .env.local and restart.");
  }
});

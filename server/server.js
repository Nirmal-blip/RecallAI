
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import chatRoutes from "./routes/chat.js";

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Server is working!"
  });
});

// Chat route
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error);
  });

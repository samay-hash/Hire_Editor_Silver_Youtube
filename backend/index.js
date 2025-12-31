const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./db");
const userRoutes = require("./routes/authUser");
const adminRoutes = require("./routes/authAdmin");
const videoRoutes = require("./routes/video");
const editorRoutes = require("./routes/editor");
const inviteRoutes = require("./routes/invite");
const errorHandler = require("./middlewares/errorHandler");

const { google } = require("googleapis");

const app = express();

// configure CORS to allow credentials (cookies) from frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

connectDB();

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/editor", editorRoutes);
app.use("/api/v1", inviteRoutes);

// central error handler (should be last middleware)
app.use(errorHandler);

app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT
    );

    const { tokens } = await oauth2Client.getToken(code);

    console.log("TOKENS ===>", tokens);

    res.json({
      success: true,
      tokens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Token exchange failed",
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const userModel = require("../models/user");

// Zod schemas for request validation
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// helper: create access token
function createAccessToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_USER || "secret_user",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );
}

// helper: create refresh token
function createRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET_USER || "refresh_secret",
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
}

// Signup route: validate, hash password, create user
router.post("/signup", async (req, res) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const { email, password, name } = parsed;

    const existing = await userModel.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already in use" });

    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
    const hashed = await bcrypt.hash(password, saltRounds);

    const newUser = await userModel.create({
      email,
      password: hashed,
      name,
    });

    // issue tokens on signup
    const accessToken = createAccessToken(newUser);
    const refreshToken = createRefreshToken(newUser);

    // persist refresh token
    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    // set httpOnly cookie for refresh token for persistent login
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "User Created",
      user: { _id: newUser._id, email: newUser.email },
      accessToken,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// Signin route: validate, compare, issue tokens
router.post("/signin", async (req, res) => {
  try {
    const parsed = signinSchema.parse(req.body);
    const { email, password } = parsed;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.password)
      return res.status(500).json({ message: "User has no password stored" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Persist the refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Send refresh token as httpOnly cookie for persistence
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Refresh access token using refresh token cookie
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "No refresh token provided" });

    // verify refresh token
    const payload = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET_USER || "refresh_secret"
    );
    const user = await userModel.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // check token exists in DB (not revoked)
    if (!user.refreshTokens.includes(token)) {
      return res.status(403).json({ message: "Refresh token revoked" });
    }

    const accessToken = createAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res
      .status(401)
      .json({ message: "Could not refresh token", error: err.message });
  }
});

// Logout: remove refresh token from DB and clear cookie
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.json({ message: "No token to clear" });

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET_USER || "refresh_secret"
      );
      const user = await userModel.findById(payload.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
        await user.save();
      }
    } catch (e) {
      // ignore invalid token
    }

    // clear cookie on client
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
});

module.exports = router;

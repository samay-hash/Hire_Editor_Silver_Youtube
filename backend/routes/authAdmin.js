const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const adminModel = require("../models/admin");

const signinSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await adminModel.create({ email, password: hashed, name });
    res.json({ message: "Admin Created" });
  } catch (err) {
    next(err);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const parsed = signinSchema.parse(req.body);
    const { email, password } = parsed;
    const admin = await adminModel.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN || "secret_admin", { expiresIn: "8h" });
    res.json({ token });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
    next(err);
  }
});

module.exports = router;

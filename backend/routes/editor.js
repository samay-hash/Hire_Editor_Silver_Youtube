const { Router } = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const userModel = require("../models/user");
const EditorAssignment = require("../models/EditorAssignment");

const router = Router();

const signupSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() });

// EDITOR SIGNUP — validates input and links invite if present
router.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const { email, password, name } = parsed;
    const hashed = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({ email, password: hashed, name });

    const invite = await EditorAssignment.findOne({ editorEmail: email, status: "invited" });
    if (invite) {
      invite.status = "accepted";
      invite.editorId = newUser._id;
      await invite.save();
    }

    res.json({ message: "Editor signup successful", userId: newUser._id });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
    next(err);
  }
});

module.exports = router;

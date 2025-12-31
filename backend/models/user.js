const mongoose = require("mongoose");

// User schema: add `refreshTokens` to support persistent login via refresh tokens
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  // store issued refresh tokens so we can revoke them on logout
  refreshTokens: { type: [String], default: [] },
});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;

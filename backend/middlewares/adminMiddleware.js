const jwt = require("jsonwebtoken");

// Accepts `Authorization: Bearer <token>` or `token` header
const AdminMiddleware = function (req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.token;
    if (!auth) return res.status(401).json({ message: "No token provided" });
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_ADMIN || "secret_admin"
    );
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Admin Unauthorized", error: err.message });
  }
};

module.exports = { AdminMiddleware };

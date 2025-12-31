const jwt = require("jsonwebtoken");

function creatorAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.token;
    if (!auth) return res.status(401).json({ message: "No token provided" });
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_USER || "secret_user"
    );

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Not authorized", error: err.message });
  }
}

module.exports = { creatorAuth };

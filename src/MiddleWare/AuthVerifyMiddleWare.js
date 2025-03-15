const jwt = require("jsonwebtoken");


module.exports = (req, res, next) => {
  const token = req.header("Authorization");
  console.log("Token Received:", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const decoded = jwt.verify(token, "Kingbaji");
    req.userId = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(400).json({ message: "Invalid token" });
  }
};

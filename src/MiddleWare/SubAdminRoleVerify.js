exports.verifySubAdmin = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) return res.status(401).json({ message: "Token missing!" });

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const decodedEmail = decoded?.email;
    const decodedRole = decoded?.user_role; // Fix role field

    if (!decodedEmail || !decodedRole) {
      return res.status(400).json({ message: "Invalid token payload!" });
    }

    const response = await SubAdmin.aggregate([
      { $match: { email: decodedEmail, user_role: decodedRole } },
      {
        $project: {
          email: 1,
          name: 1,
          phone: 1,
          countryCode: 1,
          balance: 1,
          referredbyCode: 1,
          referredLink: 1,
          referredCode: 1,
          user_role: 1,
          isActive: 1,
        },
      },
    ]);

    const userDetails = response[0];

    if (userDetails.length === 0) return res.status(404).json({ message: "User not found" });



    res.status(200).json({
      success: true,
      token,
      userDetails,
    });

  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid token!" });
  }
};
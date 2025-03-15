const jwt = require("jsonwebtoken");
const SubAdmin = require("../Models/SubAdminModel");
const User = require("../Models/User");

const JWT_SECRET = process.env.JWT_SECRET || "Kingbaji";

exports.GetAllUserForSUbAdmin = async (req, res) => {
  try {
    // Fetch user details using aggregation
    const users = await User.aggregate([
      {
        $project: {
          email: 1,
          name: 1,
          phone: 1,
          countryCode: 1,
          balance: 1,
          referralByCode: 1,
          user_referredLink: 1,
          agent_referredLink: 1,
          affiliate_referredLink: 1,
          referralCode: 1,
          user_role: 1,
          _id: 0,
        },
      },
    ]);

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Generate JWT tokens for each user (if needed)
    const usersWithTokens = users.map(user => ({
      ...user,
      token: jwt.sign({ email: user.email, user_role: user.user_role }, JWT_SECRET, { expiresIn: "2h" }),
    }));

    res.status(200).json({
      success: true,
      users: usersWithTokens,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.GetAllUserForSUbAdmin = async (req, res) => {
    try {
        const user = req.params.newUser;
        if (!newUser) {
          return res.status(400).json({ message: "User ID is required" });
        }
        const newUser = await SubAdmin.findOne({ email: user, user_role: "user" });
        if (!newUser) {
          return res.status(404).json({ message: "User not found" });
        }
        if (newUser.referralCode.length > 9) {
            const users = await User.aggregate([
                { $match: { referralByCode: newUser.referralCode } },
              {
                $project: {
                  email: 1,
                  name: 1,
                  phone: 1,
                  countryCode: 1,
                  balance: 1,
                  referralByCode: 1,
                  user_referredLink: 1,
                  agent_referredLink: 1,
                  affiliate_referredLink: 1,
                  referralCode: 1,
                  user_role: 1,
                  _id: 0,
                },
              },
            ]);
            res.status(200).json({
                success: true,
                users: usersWithTokens,
              });
          }
    
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
      }
};



exports.GetAllUserForSUbAdmin = async (req, res) => {
  try {
    const user = req.params.newUser;
    if (!newUser) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const newUser = await SubAdmin.findOne({ email: user, user_role: "user" });
    if (!newUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (newUser.referralCode.length > 8) {
        const users = await User.aggregate([
            { $match: { referralByCode: newUser.referralCode } },
          {
            $project: {
              email: 1,
              name: 1,
              phone: 1,
              countryCode: 1,
              balance: 1,
              referralByCode: 1,
              user_referredLink: 1,
              agent_referredLink: 1,
              affiliate_referredLink: 1,
              referralCode: 1,
              user_role: 1,
              _id: 0,
            },
          },
        ]);
        res.status(200).json({
            success: true,
            users: usersWithTokens,
          });
      }

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.GetAllUserForAgent = async (req, res) => {
  try {
    const user = req.params.newUser;
    if (!newUser) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const newUser = await SubAdmin.findOne({ email: user, user_role: "user" });
    if (!newUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (newUser.referralCode.length > 7) {
        const users = await User.aggregate([
            { $match: { referralByCode: newUser.referralCode } },
          {
            $project: {
              email: 1,
              name: 1,
              phone: 1,
              countryCode: 1,
              balance: 1,
              referralByCode: 1,
              user_referredLink: 1,
              agent_referredLink: 1,
              affiliate_referredLink: 1,
              referralCode: 1,
              user_role: 1,
              _id: 0,
            },
          },
        ]);
        res.status(200).json({
            success: true,
            users: usersWithTokens,
          });
      }

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.GetAllUserForSUbAgent = async (req, res) => {
  try {
    const user = req.params.newUser;
    if (!newUser) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const newUser = await SubAdmin.findOne({ email: user, user_role: "user" });
    if (!newUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (newUser.referralCode.length > 5) {
        const users = await User.aggregate([
            { $match: { referralByCode: newUser.referralCode } },
          {
            $project: {
              email: 1,
              name: 1,
              phone: 1,
              countryCode: 1,
              balance: 1,
              referralByCode: 1,
              user_referredLink: 1,
              agent_referredLink: 1,
              affiliate_referredLink: 1,
              referralCode: 1,
              user_role: 1,
              _id: 0,
            },
          },
        ]);
        res.status(200).json({
            success: true,
            users: usersWithTokens,
          });
      }

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.GetAllrefarlUserForuser = async (req, res) => {
  try {
    const user = req.params.newUser;
    if (!newUser) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const newUser = await SubAdmin.findOne({ email: user, user_role: "user" });
    if (!newUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (newUser.referralCode.length > 6) {
        const users = await User.aggregate([
            { $match: { referralByCode: newUser.referralCode } },
          {
            $project: {
              email: 1,
              name: 1,
              phone: 1,
              countryCode: 1,
              balance: 1,
              referralByCode: 1,
              user_referredLink: 1,
              agent_referredLink: 1,
              affiliate_referredLink: 1,
              referralCode: 1,
              user_role: 1,
              _id: 0,
            },
          },
        ]);
        res.status(200).json({
            success: true,
            users: usersWithTokens,
          });
      }

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

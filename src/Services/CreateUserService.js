const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const User = require('../Models/User');



const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "Kingbaji";

exports.register = async (req, res) => {
  try {
    const {referredbyCode} = req.params
    console.log(referredbyCode)
    const { userId, phone, password, countryCode } = req.body;

    if (!userId || !phone || !password || !countryCode) {
      return res.status(400).json({ success: false, message: "Please enter all fields" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const referredCode = Math.random().toString(36).substring(2, 8);

    // ✅ Step 1: Create User Immediately
    const newUser = await User.create({
      userId,
      phone,
      countryCode,
      password: hashedPassword, // Store hashed password
      referredbyCode: referredbyCode || null,
      referredCode,
      apiVerified: false, // Add a field to check API success later
    });



     // ✅ Step 3: Call External API Asynchronously
     const operatorcode = "rbdb";
     const secret = "9332fd9144a3a1a8bd3ab7afac3100b0";
     const newUserCreate = userId.toLowerCase();
     const signature = crypto.createHash("md5").update(operatorcode + newUserCreate + secret).digest("hex").toUpperCase();
 
     const apiUrl = `http://fetch.336699bet.com/createMember.aspx?operatorcode=${operatorcode}&username=${newUserCreate}&signature=${signature}`;

    // ✅ Step 2: Generate JWT Token (Send Response Immediately)
    const token = jwt.sign({ id: newUser.userId }, JWT_SECRET, { expiresIn: "2h" });

    res.status(201).json({
      success: true,
      message: "User created successfully. API verification pending...",
      token,
      user: {
        userId: newUser.userId,
        phone: newUser.phone,
        countryCode: newUser.countryCode,
        balance: newUser.balance || 0,
        referredbyCode: newUser.referredbyCode,
        referredCode: newUser.referredCode,
        apiVerified: false,
      },
    });

   

    try {
      const apiResponse = await axios.get(apiUrl);

      console.log("API Response Data:", apiResponse);

      // ✅ Step 4: If API response is successful, update user in DB
      if (apiResponse.data && apiResponse.data.errMsg === "SUCCESS") {
        await User.updateOne({ userId }, { $set: { apiVerified: true } });
        console.log(`✅ User ${userId} verified with external API`);
      } else {
        console.warn(`⚠️ External API verification failed for user ${userId}`);
      }
    } catch (apiError) {
      console.error(`❌ External API error for user ${userId}:`, apiError.message);
    }
  } catch (error) {
    console.error("❌ Error in register function:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.loginUser = async (req, res) => {
  const { userId, password } = req.body;
console.log(req.body);
  try {
    if (!userId) {
      return res.status(400).json({ message: "User Not Found, Please Login Or Sign Up" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const response = await User.aggregate([
      { $match: { userId } },
      {
        $project: {
          userId: 1,
          name: 1,
          phone: 1,
          balance: 1,
          referredbyCode: 1,
          referredLink: 1,
          referredCode: 1,
          timestamp:1,
        },
      },
    ]);

    const token = jwt.sign({ id: user.userId }, JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({ token, user, response });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.verify =async (req, res) => {
  const authHeader = req.header("Authorization");
  console.log("userId",authHeader);
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing!" }); 
  try {
    const decoded = jwt.verify(token, "Kingbaji");

    const decodedId = decoded?.id;
    const details = await User.aggregate([
      { $match: { userId:decodedId } },
      {
        $project: {
          userId: 1,
          name: 1,
          phone: 1,
          balance: 1,
          
          referredbyCode: 1,
          referredLink: 1,
          referredCode: 1,
          timestamp:1,
        },
      },
    ]);
    // console.log( "decoded",details );
    res.status(200).json({ message: "User authenticated", userId: decoded.id,user:details[0]});
  } catch (error) {
    res.status(400).json({ message: "Invalid token!" });
  }
};




exports.userDetails =async (req, res) => {
  const { userId } = req.body;
  // const authHeader = req.header("Authorization");
  // console.log("userId", req.body.userId);
  // console.log("userId :            1", userId);
  // const token = authHeader?.split(" ")[1];
  // if (!token) return res.status(401).json({ message: "Token missing!" }); 
  try {
    // const decoded = jwt.verify(token, "Kingbaji");
console.log(userId)
    // const decodedId = decoded?.id;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(user.userId )
    if (user) {
    const details = await User.aggregate([
      { $match: { userId:user.userId } },
      {
        $project: {
          userId: 1,
          name: 1,
          phone: 1,
          balance: 1,
          referredbyCode: 1,
          referredLink: 1,
          referredCode: 1,
          timestamp:1,
        },
      },
    ]);
    console.log( "decoded",details );
    res.status(200).json({ message: "User balance",user:details[0]});
  } else {
    res.status(200).json({ message: "User game balance is 0",user:details[0]});
  }
  } catch (error) {
    console.log( "error",error );
    res.status(400).json({ message: "Invalid token!" });
  }
};


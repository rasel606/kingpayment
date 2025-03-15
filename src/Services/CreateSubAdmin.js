const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const SubAdmin = require("../Models/SubAdminModel");
// const User = require("../Models/User");


const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "Kingbaji";

exports.registerSubAdmin  = async (req, res) => {
  try {
    const { email, phone, password, countryCode, referredbyCode } = req.body;
    if (!email || !phone || !password || !countryCode) {
      return res.status(400).json({ success: false, message: "Please enter all fields" });
    }
console.log("referredbyCode",email, phone, password, countryCode, referredbyCode )
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const referredCode = Math.random().toString(36).substring(2, 12);
    const referrUserCode = Math.random().toString(36).substring(2, 12);
    if (referredbyCode) {
      const referredbyUser = await SubAdmin.findOne({ referredCode: referredCode });
      const referrUser = await SubAdmin.findOneAndDelete({ referredCode: referredCode });
      if(!referrUser){
        return res.status(400).json({ success: false, message: "Invalid referred code" });
      }
    }

    const SubAdminId = Math.random().toString(36).substring(2, 12);




    const existingUser = await SubAdmin.findOne({ email:email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }




    const newUser = await SubAdmin.create({
      email,
      phone,
      countryCode,
      referredbyCode,
      referredCode:referrUserCode || referredCode,
      password: hashedPassword,
      balance: 0,
      SubAdminId: SubAdminId,
      isActive: true,
      user_referredLink: `http://localhost:3000/?ref=${referredCode || referrUserCode}`,
      agent_referredLink: `http://localhost:3000/?ref=${referredCode || referrUserCode}`,
      affiliate_referredLink: `http://localhost:3000/?ref=${referredCode || referrUserCode}`,
    });


    if (!newUser) {
      return res.status(500).json({ success: false, message: "Failed to create user" });
    }

   

    const response = await SubAdmin.aggregate([
        { $match: { email: newUser.email } },
        {
          $project: {
            email: 1,
            name: 1,
            phone: 1,
            countryCode: 1,
            balance: 1,
            referralByCode: 1,
            // referredLink: 1,
            user_referredLink: 1,
            agent_referredLink: 1,
            affiliate_referredLink: 1,
            referralCode: 1,
            user_role:1,
          },
        },
      ]);





    // ✅ Step 2: Generate JWT Token (Send Response Immediately)
    const userDetails = response[0];
    console.log("userDetails",userDetails)
    console.log(" response[0]", response[0])

    const token = jwt.sign({ email: userDetails.email, user_role: userDetails.user_role }, JWT_SECRET, { expiresIn: "30d" });
console.log("token",token)


res.status(201).json({
  success: true,

  token,
  userDetails
});

  } catch (error) {
    console.error("❌ Error in register function:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};




///////////////////////////////////////////    login   //////////////////////////////////////////////////

exports.loginSubAdmin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await SubAdmin.findOne({ email:email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });


    
    const response = await SubAdmin.aggregate([
        { $match: { email: user.email } },
        {
          $project: {
            email: 1,
            name: 1,
            phone: 1,
            countryCode: 1,
            balance: 1,
            referralCode:1,
            referralByCode: 1,
            referredLink: 1,
            user_referredLink: 1,
            agent_referredLink: 1,
            affiliate_referredLink: 1,
            referralCode: 1,
            user_role:1,
            _id:0
          },
        },
      ]);
      
      if (!response.length) return res.status(500).json({ message: "Error fetching user data" });

      const userDetails = response[0];

      const token = jwt.sign({ email: userDetails.email, user_role: userDetails.user_role }, JWT_SECRET, { expiresIn: "30d" });

    
      res.status(201).json({
        success: true,
  
        token,
        userDetails
      });
  
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



///////////////////////////////////////////////////////////    verify   //////////////////////////////////////////////////

exports.verifySubAdmin = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) return res.status(401).json({ message: "Token missing!" });

    const decoded = jwt.verify(token, JWT_SECRET);


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
            referralCode:1,
            referralByCode: 1,
            referredLink: 1,
            user_referredLink: 1,
            agent_referredLink: 1,
            affiliate_referredLink: 1,
            referralCode: 1,
            user_role:1,
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
    
    res.status(400).json({ message: "Invalid token!" });
  }
};




//////////////////////////////////////////// SubAdmin-withdrawal   //////////////////////////////////////////////////



exports.SubAdminUserDetails =async (req, res) => {
  const { email } = req.body;
  console.log(email)
  // const authHeader = req.header("Authorization");
  // console.log("userId", req.body.userId);
  // console.log("userId :            1", userId);
  // const token = authHeader?.split(" ")[1];
  // if (!token) return res.status(401).json({ message: "Token missing!" }); 
  try {
    // const decoded = jwt.verify(token, "Kingbaji");

    // const decodedId = decoded?.id;
    const user = await SubAdmin.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    
    const details = await SubAdmin.aggregate([
      { $match: { email:user.email } },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          balance: 1,
          SubAdminId: 1,
          IsActive: 1,
          user_referredLink: 1,
          affiliate_referredLink: 1,
          referralCode: 1,
          timestamp:1,
        },
      },
    ]);
    console.log( "decoded",details[0] );
    res.status(200).json({ message: "User ",user:details[0]});

  } catch (error) {
    console.log( "error",error );
    res.status(400).json({ message: "Invalid token!" });
  }
};
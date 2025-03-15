const jwt = require('jsonwebtoken')

exports.LoginService = async (req, res, dataModel) => {
   try {
    let email = req.body.email;
    const newUser = await dataModel.findOne({ email });

    if (!newUser) {
      return { status: 404, data: { message: "User not found" } };
    }

    const user = await dataModel.aggregate([
      { $match: { email } },
      {
        $project: {
          email: 1,
          firstName: 1,
          mobile: 1,
          countryCode: 1,
          balance: 1,
          role: 1,
          referredbyCode: 1,
          referredLink: 1,
        },
      },
    ]);

 
     ;
    const token = jwt.sign({ id: user[0].email, role: user[0].role }, "Kingbaji", { expiresIn: '1h' });
    
    return {
      status: 201,
        message: "Login successfully",
        token,
        email:user[0].email,
      
    };
  } catch (error) {
    return { status: 500,  message: "Server error", error  };
  }
};
  



exports.verifyAdmin = (req, res) => {
  const Authtoken = req.header('Authorization');
  console.log("token",Authtoken)
  if (!Authtoken) return res.status(401).json({ message: 'Access denied!' });

  else {
    const decoded = jwt.verify(Authtoken, "kingbaji");
    console.log(decoded)
    res.status(200).json({ message: 'User authenticated', email: decoded.email});
    res.status(400).json({ message: 'Invalid token!' });
  }

 
};

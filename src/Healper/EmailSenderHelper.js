



exports.sendOtp = async (req, res) => {
    const { mobile,email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Save OTP in memory/cache (use Redis or similar for production)
    // For simplicity, we're skipping this step.
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'your-email@gmail.com', pass: 'your-password' },
    });
  
    await transporter.sendMail({
      from: 'your-email@gmail.com',
    //   to: mobile + '@sms.gateway.com', // Example SMS gateway address
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}`,
    });
  
    res.status(200).json({ message: 'OTP sent successfully', otp });
  };




module.exports = sendOtp 
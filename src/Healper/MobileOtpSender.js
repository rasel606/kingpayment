exports.EmailSenderHelper = async (req, res) => {
    try {
      const { email, mobile } = req.body;
      const otp = generateOtp();
  
      const user = await User.findOne({ $or: [{ email }, { mobile }] });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      user.otp = otp;
      user.otpExpires = Date.now() + 300000; // OTP expires in 5 minutes
      await user.save();
  
      // Send OTP (use email/SMS service)
      await sendEmail(email, `Your OTP is ${otp}`);
  
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending OTP', error });
    }
  };




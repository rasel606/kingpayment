



exports.verifyOtpMobile = async (req, res) => {
    const { mobile, otp } = req.body;
    const user = await User.findOne({ mobile });
    if (user && user.otp === otp) {
      user.otpVerified = true;
      await user.save();
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false, message: 'Invalid OTP' });
    }
  };


exports.verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      const user = await User.findOne({ email, otp });
      if (!user || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
  
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
  
      res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying OTP', error });
    }
  };
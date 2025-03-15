exports.validateUserDetails = async (req, res) => {
    const { mobile, name, email, birthday } = req.body;
    if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json({ message: 'Invalid mobile number' });
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email' });
    if (birthday && isNaN(Date.parse(birthday))) return res.status(400).json({ message: 'Invalid birthday' });
  
    res.status(200).json({ message: 'Validation passed' });
  };
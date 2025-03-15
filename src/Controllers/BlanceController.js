

// Function to calculate hold balance
async function holdBalance(userId) {
    try {
      // Query the database for the user's withdrawal history
      const withdrawalHistory = await WithdrawHistory.find({ UserId: userId });
  
      // Calculate the total hold balance
      const hold = withdrawalHistory.reduce((total, record) => {
        if (record.status === 'pending') {
          total += parseFloat(record.amount || 0); // Ensure valid numerical addition
        }
        return total;
      }, 0);
  
      return hold;
    } catch (error) {
      console.error('Error calculating hold balance:', error);
      throw error;
    }
  }

  // Example route for testing hold balance
exports.calculateHoldBalance = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const hold = await holdBalance(userId);
      res.json({ userId, hold });
    } catch (error) {
      res.status(500).json({ error: 'Error calculating hold balance' });
    }
  });
  
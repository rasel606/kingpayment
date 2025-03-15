const { User, Promotion, Game } = require('../models');

const checkPromotion = async (req, res, next) => {
    const { userId, gameId } = req.body;

    const user = await User.findById(userId).populate('activePromotion');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.activePromotion) return next(); // যদি কোন প্রোমোশন না থাকে, তাহলে সব গেম খেলতে পারবে

    const promotion = user.activePromotion;
    const isEligible = promotion.eligibleGames.some(game => game.equals(gameId));

    if (!isEligible) {
        return res.status(403).json({ message: 'Not Enter Game' });
    }

    next();
};

module.exports = { checkPromotion };

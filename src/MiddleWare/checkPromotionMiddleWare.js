const express = require('express');
const router = express.Router();
const { checkPromotion } = require('../middleware/promotionCheck');

router.post('/play-game', checkPromotion, async (req, res) => {
    res.json({ message: 'Game Started' });
});

module.exports = router;

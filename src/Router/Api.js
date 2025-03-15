const express = require('express')
const router = express.Router()


const fs = require('fs');

const TransactionController = require('../Controllers/TransactionController');

const socketIo = require('socket.io');









router.post("/submitTransaction", TransactionController.submitTransaction);




module.exports = router
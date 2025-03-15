const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId: { type: String, ref: "User", required: true },
    transactionID: { type: String, required: true },
    base_amount: { type: Number, required: true },
    // currency_rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    mobile: { type: String},
    gateway_Number: { type: String },
    //currency_id: { type: mongoose.Schema.Types.ObjectId, ref: "Currency", required: true },
    //gateway: { type: Number, enum: [0, 1, 2, 3], required: true }, // 0 = Agent, 1 = Online, 2 = Token, 3 = Bank
    gateway_name: { type: String, },
    type: { type: Number, enum: [0,1,2], required: true }, // 0 = Deposit, 1 = Withdrawal,2 = Transfer,
    status: { type: Number, enum: [0, 1, 2], required: true }, // 0 = Hold, 1 = Accept, 2 = Reject
    details: { type: String },
    payment_type: { type: String, enum: ["sendMoney", "cashout", "payment"], required: true },
    datetime: { type: Date, default: Date.now },
    is_commission: { type: Boolean, default: false },
    referredbyCode: { type: String },
    updatetime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);

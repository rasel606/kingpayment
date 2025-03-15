const mongoose = require("mongoose");

const TurnOverModalSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   
    currency_rate: { type: Number, required: true },
    turnoverAmount: { type: Number, required: true },
    type: { type: String, required: true },
    status: { type: Number, enum: [0, 1, 2], required: true }, // 0 = Hold, 1 = Accept, 2 = Reject
    CreatedDate: { type: Date, default: Date.now },
    is_commission: { type: Boolean, default: false }
});


const TurnOverModal = mongoose.model("TurnOverModal", TurnOverModalSchema);
module.exports = TurnOverModal
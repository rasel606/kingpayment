
const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({

  userId: { type: String, required: true, unique: true },
  name: { type: String },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  countryCode: { type: String },
  country: { type: String },
  password: { type: String, required: true },
  birthday: { type: Date },
  referredCode: { type: String, unique: true },
  referredbyCode: { type: String },
  referredbyAgent: { type: String },
  referredbyAffiliate: { type: String },
  referredLink: { type: String },
  balance: { type: Number, default: 0,},
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isBirthdayVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  last_game_id: { type: String },
  bonus: {
    name: { type: String },
    eligibleGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    bonusAmount: { type: Number, default: 0 },
    wageringRequirement: { type: Number, default: 0 },// বোনাস এমাউন্ট
    isActive: { type: Boolean, default: true },
    appliedDate: { type: Date },
  },
  updatetimestamp: { type: Date, default: Date.now }
});
const User = mongoose.model("user", userSchema)
module.exports = User
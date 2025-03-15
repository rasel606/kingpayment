const mongoose = require("mongoose");

const subAdminSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    referralByCode: { type: String, minlength: 8, maxlength: 9 },
    referralCode: { type: String, unique: true, minlength: 8, maxlength: 9 },
    SubAdminId: { type: String, unique: true, minlength: 9, maxlength: 10 },
    user_referredLink: { type: String, unique: true },
    agent_referredLink: { type: String, unique: true },
    affiliate_referredLink: { type: String, unique: true },
    countryCode: { type: String },
    phone: { type: String },
    user_role: { type: String, default: "subAdmin" },
    users: [{ type: String, ref: 'User' }],
    Agent: [{ type: String, ref: 'Agent' }],
    Affiliate: [{ type: String, ref: 'Affiliate' }],
    IsActive: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    updatetimestamp: { type: Date, default: Date.now },
  },
   // Automatically adds createdAt & updatedAt timestamps
);

const SubAdmin = mongoose.model("SubAdmin", subAdminSchema);

module.exports = SubAdmin;

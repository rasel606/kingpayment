const mongoose = require('mongoose');

const subAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  referralByCode: { type: String, min: 8, max: 8 },
  referralCode: { type: String, unique: true, min: 8, max: 8 },
  SubAdminId: { type: String, min: 8, max: 8 },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  IsActive: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
  updatetimestamp: { type: Date, default: Date.now },
});

const SubAgent = mongoose.model('SubAgent', subAgentSchema);

module.exports = SubAgent;

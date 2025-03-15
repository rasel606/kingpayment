const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the transaction
const WidthrowTableHistorySchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionID: { type: String, required: true, unique: true },
  base_amount: { type: Number, required: true },
  currency_rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  gateway: { type: Number, enum: [0, 1, 2, 3], required: true }, // 0 = Agent, 1 = Online, 2 = Token, 3 = Bank
  gateway_name: { type: String, required: true },
  type: { type: String, required: true }, // The type can be further defined based on your use case
  coin: { type: String, required: true },
  contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  status: { type: Number, enum: [0, 1, 2], default: 0 }, // 0 = Hold, 1 = Accept, 2 = Reject
  details: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
  is_commission: { type: Boolean, default: false },
});

// Create the model based on the schema
const WidthrowTableHistory = mongoose.model('WidthrowTableHistory', WidthrowTableHistorySchema);

module.exports = WidthrowTableHistory;
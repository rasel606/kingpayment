const mongoose = require('mongoose');
const DataSchema = mongoose.Schema({

    email: { type: String, required: true, unique: true },
    firstName: { type: String},
    mobile: { type: String,  unique: true },
    countryCode: { type: String, required: true },
    balance: { type: Number},
 
    referredLink: { type: String, default: null },
    referredCode: { type: String, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Admin" },
    timestamp: { type: Date, default: Date.now },
    updatetimestamp: { type: Date, default: Date.now },
},
    {
        versionKey: false
    })

const AdminModel = mongoose.model("admin", DataSchema)
module.exports = AdminModel


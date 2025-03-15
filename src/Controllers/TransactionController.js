const PaymentGateWayTable = require('../Models/PaymentGateWayTable');
const Transaction = require('../Models/TransactionModel');
const User = require('../Models/User');
const SubAdmin = require('../Models/SubAdminModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const TransactionModel = require('../Models/TransactionModel');
// exports.addTransaction = async (req, res) => {
//   try {
//     const { userId, amount, type } = req.body;
//     const transaction = new Transaction({ userId, amount, type });
//     await transaction.save();

//     // Update user balance
//     const user = await User.findOne(userId);
//     user.balance += type === 'recharge' ? amount : -amount;
//     await user.save();

//     res.status(201).json({ message: 'Transaction completed successfully', transaction });
//   } catch (error) {
//     res.status(500).json({ message: 'Error completing transaction', error });
//   }
// };


const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "Kingbaji";


////////////////////////////////////////////////////////////////
// app.post("/process-payment", async (req, res) => {
//     const { userId, amount, method } = req.body;

//     // Fetch user data from the database
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Generate the redirect URL with user details


//   });




// router.post("/deposit", 
exports.addTransaction = async (req, res) => {
    const { userId, amount, gateway_name, gateway_Number, payment_type, referredbyCode } = req.body;
    console.log(req.body);
    console.log(payment_type);
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for referredCode and find the referral
        let referralCode = null;  // Renamed to avoid overwriting `referredbyCode`
        if (referredbyCode) {
            const referredUser = await User.findOne({ referredbyCode });
            if (referredUser) {
                referralCode = referredUser.referredbyCode; // Assign the actual referred user's code
            }
        }



        const token = jwt.sign({ id: user.userId }, JWT_SECRET, { expiresIn: "2h" });

        let redirectUrl = `https://kingbaji.live/${encodeURIComponent(gateway_name)}?userId=${encodeURIComponent(user.userId)}&name=${encodeURIComponent(user.name)}&amount=${encodeURIComponent(amount)}&referredbyCode=${encodeURIComponent(referredbyCode || '')}&payment_type=${encodeURIComponent(payment_type)}&gateway_Number=${encodeURIComponent(gateway_Number)}&token=${encodeURIComponent(token)}&type=${encodeURIComponent(0)}`;
        res.redirect(redirectUrl);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};



// app.post("/api/v1/submitTransaction", 
exports.submitTransaction = async (req, res) => {

    try {
        const {
            userId,
            gateway_name,
            amount,
            referredbyCode,
            payment_type,
            gateway_number,
            transactionID,
        } = req.body;



        console.log("req.body  --------- 1 ", req.body);


        //   if (!/^[a-zA-Z0-9]{10}$/.test(transactionID)) {
        //     return res.status(400).json({ error: "Invalid transaction ID format." });
        //   }

        const user = await User.findOne({ userId, referredbyCode });
        console.log("user", user)
        if (!user) {
            res.status(404).json({ message: 'User not found' });
        }

        const transaction = await TransactionModel.findOne({ userId, referredbyCode: user.referredbyCode, transactionID, payment_type });
        console.log("req.body ------------------ 3", transaction);
        if (transaction) {
            res.status(404).json({ message: 'User transaction already used' });
        }else{

            const bonus = (parseFloat(amount) * 0.03);
            const type = 0;
    
    
            console.log("req.body ------------------ 2", req.body);
    
            const newTransaction = await Transaction.create({
                userId: user.userId,
                transactionID,
                base_amount: amount,
                amount: amount + bonus,
                currency_id: user.currency_id,  // Assuming this is set in User model
                gateway_name: gateway_name,
                gateway_Number: gateway_number, // Assuming a fixed gateway name for now
                payment_type: payment_type,
                mobile: user.phone,
                type: type,
                status: 0,  // 0 = pending
                referredbyCode: user.referredbyCode, // Assign the referral code to the transaction
                is_commission: false,
            });
    
    
            console.log("newTransaction", newTransaction);
    
            res.json({ success: true, message: `Transaction submitted successfully ${user?.transactionID}` });
        }


        // Calculate bonus (3.5% of the deposit)
       
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
}



///////////////////////////////////////////////////////////////

// router.put("/deposit/approve/:transactionID", 
exports.approveDepositbySubAdmin = async (req, res) => {
    try {
        const { userId, referralCode, status } = req.body;
        const transactionID = req.params.transactionID;
        console.log(userId, referralCode, status, transactionID);
        // Find the user
        const user = await User.findOne({ userId, referredbyCode: referralCode });
        if (user.referredbyCode !== referralCode) return res.status(404).json({ message: 'User not found' });

        // Find the sub-admin
        const subAdmin = await SubAdmin.findOne({ referralCode: referralCode });

        if (!subAdmin.referralCode === referralCode) {
            return res.status(400).json({ message: 'Invalid Match' });
        }
        // Find the transaction
        const transaction = await TransactionModel.findOne({ userId, transactionID, referredbyCode: subAdmin.referralCode });


        // Ensure transaction is not already processed
        if (transaction.referredbyCode !== subAdmin.referralCode && transaction.referredbyCode === user.referredbyCode) {

            return res.status(400).json({ message: "Transaction already processed" });
        }


        if (transaction.referredbyCode !== subAdmin.referralCode && transaction.userId !== user.userId && transaction.transactionID !== transactionID && transaction.referredbyCode !== user.referredbyCode) {
            res.status(400).json({ message: "Transaction not found" });
        }

        console.log(subAdmin.balance >= transaction.amount && transaction.referredbyCode === subAdmin.referralCode && transaction.userId === user.userId && transaction.transactionID === transactionID && transaction.referredbyCode === user.referredbyCode);
        if (subAdmin.balance >= transaction.amount && transaction.referredbyCode === subAdmin.referralCode && transaction.userId === user.userId && transaction.transactionID === transactionID && transaction.referredbyCode === user.referredbyCode) {


            console.log(transaction);

            if (parseInt(req.body.status) === parseInt(1)) {

                subAdmin.balance -= transaction.amount;


                const bonusAmount = (transaction.amount * 0.03) 
                user.balance += transaction.amount + bonusAmount;
                if (user.bonus) {
                    user.bonus.bonusAmount += bonusAmount;
                    user.bonus.isActive = true;
                    user.bonus.appliedDate = new Date();
                }

                transaction.updatetime = new Date();
                transaction.status = 1; // Mark as approved
                await user.save();
                await subAdmin.save();
                await transaction.save();
                return res.status(200).json({ message: "Deposit processed successfully", user });
            }
            transaction.updatetime = new Date();
            transaction.status = parseInt(2)// Mark as approved
            await transaction.save();


            return res.status(200).json({ message: "Deposit processed successfully", transaction });
        }

        let Admin_Balance = SubAdmin.balance
        res.status(200).json({ message: "Admin balance not enough", Admin_Balance });



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};



// exports.approveDepositbySubAdmin = async (req, res) => {
//     try {
//         const { userId, referralCode, status } = req.body;
//         const transactionID = req.params.transactionID;
//         console.log(userId, referralCode, status, transactionID);

//         // Find the user
//         const user = await User.findOne({ userId, referredbyCode: referralCode });
//         if (!user || user.referredbyCode !== referralCode) return res.status(404).json({ message: 'User not found' });

//         const subAdmin = await SubAdmin.findOne({ referralCode: referralCode });
//         if (!subAdmin || subAdmin.referralCode !== referralCode) {
//             return res.status(400).json({ message: 'Invalid Match' });
//         }

//         // Find the transaction
//         const transaction = await Transaction.findOne({ userId, transactionID, referredbyCode: subAdmin.referralCode });
//         if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

//         // Ensure transaction is not already processed
//         if (transaction.status !== 0) {
//             return res.status(400).json({ message: "Transaction already processed" });
//         }

//         // Process deposit approval
//         if (subAdmin.balance >= transaction.amount && transaction.referredbyCode === subAdmin.referralCode && transaction.userId === user.userId && transaction.transactionID === transactionID && transaction.referredbyCode === user.referredbyCode && parseInt(status) === 1) {
// console.log("user.amount", user.balance);
//             subAdmin.balance -= transaction.amount;
//             await subAdmin.save();

//             const bonusAmount = (transaction.amount * 30) / 100;
//             user.balance += transaction.amount + bonusAmount;

//             if (user.bonus) {
//                 user.bonus.bonusAmount += bonusAmount;
//                 user.bonus.isActive = true;
//                 user.bonus.appliedDate = new Date();
//             }

//             transaction.updatetime = new Date();
//             transaction.status = 1; // Mark as approved
//             await user.save();
//             await transaction.save();

//             return res.status(200).json({ message: "Deposit processed successfully", user, transaction });





//         } else {

//             transaction.status = 2; // Mark as rejected
//             transaction.updatetime = new Date();
//             await transaction.save();

//             return res.status(200).json({ message: "Deposit rejected", user });
//         }

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


exports.AddPaymentMethodNumber = async (req, res) => {
    try {
        const { user_role, email, gateway_Number, referralCode, gateway_name, type, payment_type, image_url } = req.body.formData;
        console.log("Received Data:", user_role, email, gateway_Number, referralCode, gateway_name, type, payment_type);


        // Check if user exists
        const user = await SubAdmin.findOne({ user_role, email, referralCode });
        console.log("user", user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User Found:", user);

        // Ensure you have a PaymentGateWayTable model
        const newPaymentMethod = new PaymentGateWayTable({
            user_role: user.user_role,  // Assuming the user ID should be linked
            email,
            gateway_Number,
            gateway_name,
            type: parseInt(type),
            payment_type,
            image_url,
            referredbyCode: user.referralCode,  // Using correct field name
            start_time: { hours: new Date().getHours(), minutes: new Date().getMinutes() },
            end_time: {
                hours: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getHours(),
                minutes: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getMinutes()
            },
            is_active: true,
            updatetime: new Date()
        });

        // Save to Database
        await newPaymentMethod.save();

        return res.status(201).json({ message: "Payment method added successfully", data: newPaymentMethod });

    } catch (error) {
        console.error("Error adding payment method:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};





//////////////////////////////////withdrawWIth///////////////////////////////

// exports.withdrawWIth = async (req, res) => {
//     const { userId, amount,  referredCode } = req.body;

//     try {
//         const { userId, referralCode,status } = req.body;
//         const transactionID = req.params.transactionID;
// console.log(userId, referralCode.length,status ,transactionID);
//         // Find the user
//         const user = await User.findOne({ userId });
//         if (!user) return res.status(404).json({ message: 'User not found' });
//         console.log(user);
//         // Find the transaction
//         const transaction = await TransactionModel.findOne({ userId, transactionID });
//         if (!transaction) return res.status(404).json({ message: "Transaction not found" });
// console.log(transaction);
//         // Ensure transaction is not already processed
//         if (transaction.status !== 0) {
//             return res.status(400).json({ message: "Transaction already processed" });
//         }

//         // Process deposit approval
//         const bonusAmount = (transaction.amount * 0.35) / 100;

//         if (req.body.status === 1) { // Approve transaction
//             user.balance += transaction.amount + bonusAmount;
//             user.bonus.bonusAmount += bonusAmount;

//             // Referral bonus handling
//             if (referralCode) {
//                 const subAdmin = await SubAdmin.findOne({ referralCode: referralCode });
//                 if (!subAdmin) {
//                     return res.status(400).json({ message: 'Invalid referralCode' });
//                 }

//                 subAdmin.balance > transaction.amount ? subAdmin.balance -= (transaction.amount) : subAdmin.balance
//                 // subAdmin.bonus += bonusAmount;
//                 subAdmin.balance > transaction.amount && await subAdmin.save();

//             }
//             transaction.updatetime = new Date();
//             transaction.status = 1; // Mark as approved

//         } else if (req.body.status === 2) { // Reject transaction
//             transaction.status = 2; // Mark as rejected
//         } else {
//             return res.status(400).json({ message: "Invalid transaction status" });
//         }

//         await user.save();
//         await transaction.save();
// console.log(user);
// console.log(transaction);
//         res.status(200).json({ message: "Deposit processed successfully", user });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }


exports.WidthdrawTransaction = async (req, res) => {
    const { userId, amount, gateway_name, gateway_Number, payment_type, referredbyCode } = req.body;
    console.log(req.body);
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        // Check for referredCode and find the referral
        let referralCode = null;  // Renamed to avoid overwriting `referredbyCode`
        if (referredbyCode) {
            const referredUser = await User.findOne({ referredbyCode });
            if (referredUser) {
                referralCode = referredUser.referredbyCode; // Assign the actual referred user's code
            }
        }



        const type = 1

        // const transactionID = `waiting-${Date.now()}`;
        const newTransaction = new Transaction({
            userId: user.userId,
            //  transactionID,
            base_amount: amount,
            //currency_id: user.currency_id,  // Assuming this is set in User model
            // gateway_name: gateway_name,
            //gateway_Number: gateway_Number, // Assuming a fixed gateway name for now
            payment_type: payment_type,
            type: type,
            status: 0,  // 0 = pending
            referredbyCode: referralCode, // Assign the referral code to the transaction
            is_commission: false,
        });


        await newTransaction.save();
        console.log(newTransaction);
        // if (newTransaction.status !== 0) {
        user.balance -= amount
        await user.save();
        // }

        const token = jwt.sign({ id: user.userId }, JWT_SECRET, { expiresIn: "2h" });

        // let redirectUrl = `http://localhost:3001/${encodeURIComponent(gateway_name)}?userId=${encodeURIComponent(user._id || '')}&name=${encodeURIComponent(user.name || '')}&amount=${encodeURIComponent(amount || 0)}&referredbyCode=${encodeURIComponent(referredbyCode || '')}&payment_type=${encodeURIComponent(payment_type || '')}&gateway_Number=${encodeURIComponent(gateway_Number || '')}&token=${encodeURIComponent(transactionID)}&token=${encodeURIComponent(token)}`;
        res.json({
            message: "withdraw processed successfully",
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};


///////////////////////////////////////////

exports.approveWidthdrawBySubAdmin = async (req, res) => {


    try {
        const { userId, referralCode, status } = req.body;
        const transactionID = req.params.transactionID;
        console.log(userId, referralCode, status, transactionID);
        // Find the user
        const user = await User.findOne({ userId, referredbyCode: referralCode });
        if (user.referredbyCode !== referralCode) return res.status(404).json({ message: 'User not found' });

        // Find the sub-admin
        const subAdmin = await SubAdmin.findOne({ referralCode: referralCode });

        if (!subAdmin.referralCode === referralCode) {
            return res.status(400).json({ message: 'Invalid Match' });
        }
        // Find the transaction
        const type = 1
        const transaction = await TransactionModel.findOne({ userId, transactionID, referredbyCode: subAdmin.referralCode, type: type });


        // Ensure transaction is not already processed
        if (transaction.referredbyCode !== subAdmin.referralCode && transaction.referredbyCode === user.referredbyCode) {

            return res.status(400).json({ message: "Transaction already processed" });
        }


        if (transaction.referredbyCode !== subAdmin.referralCode && transaction.userId !== user.userId && transaction.transactionID !== transactionID && transaction.referredbyCode !== user.referredbyCode) {
            res.status(400).json({ message: "Transaction not found" });
        }


        console.log(subAdmin.balance >= transaction.amount && transaction.referredbyCode === subAdmin.referralCode && transaction.userId === user.userId && transaction.transactionID === transactionID && transaction.referredbyCode === user.referredbyCode);
        if (subAdmin.balance >= transaction.amount && transaction.referredbyCode === subAdmin.referralCode && transaction.userId === user.userId && transaction.transactionID === transactionID && transaction.referredbyCode === user.referredbyCode) {


            console.log(transaction);

            if (parseInt(req.body.status) === parseInt(1)) {

                subAdmin.balance += transaction.amount;



                user.balance -= transaction.amount;


                transaction.updatetime = new Date();
                transaction.status = 1; // Mark as approved
                await user.save();
                await subAdmin.save();
                await transaction.save();
                return res.status(200).json({ message: "Deposit processed successfully", user });
            }
            transaction.updatetime = new Date();
            transaction.status = parseInt(2)// Mark as approved
            await transaction.save();


            return res.status(200).json({ message: "Deposit processed successfully", transaction });
        }

        let Admin_Balance = SubAdmin.balance
        res.status(200).json({ message: "Admin balance not enough", Admin_Balance });



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}



///////////////////////////////// search Transaction //////////////////////////////////////////


exports.searchWidthdrawTransactions = async (req, res) => {
    try {
        const { userId, amount, gateway_name, status, referredbyCode, startDate, endDate } = req.body;
        console.log(userId, amount, gateway_name, status, referredbyCode, startDate, endDate);
        // console.log(req.body);



        const SubAdminuser = await SubAdmin.findOne({ referralCode: referredbyCode })
        if (!SubAdminuser) return res.status(404).json({ message: 'User not found' });
        console.log("SubAdminuser",SubAdminuser);
        // Find the transaction
        // const user = await User.findOne({ referredbyCode: SubAdminuser.referralCode });
        // if (!user) return res.status(404).json({ message: 'User not found' });
        // console.log(user);

        const transactionExists = await TransactionModel.find({ referredbyCode:SubAdminuser.referralCode, type: parseInt(1) });
        console.log("SubAdminuser-----------3",transactionExists);
        if (!transactionExists) return res.status(404).json({ transactions:0 });
        


        let query = {};

        if (userId) {
            query.userId = userId;
        }
        if (amount) {
            query.base_amount = { $gte: parseFloat(amount) }; // Filters transactions where amount is greater than or equal
        }
        if (gateway_name) {
            query.gateway_name = gateway_name;
        }
        if (status !== undefined && !isNaN(status) && status !== "") {
            query.status = parseInt(status);
        }


        if (startDate && endDate) {
            query.datetime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else if (startDate) {
            query.datetime = { $gte: new Date(startDate) };
        }
        console.log(query);
        const transactions = await Transaction.find({ ...query, referredbyCode: SubAdminuser.referralCode, type: parseInt(1) }).sort({ createdAt: -1 });

        console.log("SubAdminuser ---------2",transactions)
        res.json({ transactions:transactions });
    } catch (error) {
        console.error("Error searching transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
};










exports.searchDepositTransactions = async (req, res) => {
    try {
        const { userId, amount, gateway_name, status, referredbyCode, startDate, endDate } = req.body;
        console.log(userId, amount, gateway_name, status, referredbyCode, startDate, endDate);
        // console.log(req.body);



        const SubAdminuser = await SubAdmin.findOne({ referralCode: referredbyCode })
        if (!SubAdminuser) return res.status(404).json({ message: 'User not found' });
        console.log(SubAdminuser);
        // Find the transaction
        // const user = await User.findOne({ referredbyCode: SubAdminuser.referralCode });
        // if (!user) return res.status(404).json({ message: 'User not found' });
        // console.log(user);

        const transactionExists = await TransactionModel.findOne({ referredbyCode, type: 0 });
        if (!transactionExists) return res.status(404).json({ message: "Transaction not found" });
        console.log(transactionExists);


        let query = {};

        if (userId) {
            query.userId = userId;
        }
        if (amount) {
            query.base_amount = { $gte: parseFloat(amount) }; // Filters transactions where amount is greater than or equal
        }
        if (gateway_name) {
            query.gateway_name = gateway_name;
        }
        if (status !== undefined && !isNaN(status) && status !== "") {
            query.status = parseInt(status);
        }


        if (startDate && endDate) {
            query.datetime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else if (startDate) {
            query.datetime = { $gte: new Date(startDate) };
        }
        console.log(query);
        const transactions = await Transaction.find({ ...query, referredbyCode: SubAdminuser.referralCode, type: parseInt(0) }).sort({ createdAt: -1 });

        const totalDeposit = await Transaction.aggregate([
            { $match: { referredbyCode: referredbyCode, type: 0, status: 0} }, // Filter deposits & accepted transactions
             { $match: { ...query  } }, // Filter deposits & accepted transactions
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
console.log("totalDeposit",totalDeposit[0].total)
const total= totalDeposit[0]

        res.json({ transactions , total });
    } catch (error) {
        console.error("Error searching transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
};




exports.searchTransactionsbyUserId = async (req, res) => {
    try {

        const { userId, status, startDate, endDate } = req.body;
        console.log("u", userId, status, startDate, endDate);
        // console.log(req.body);



        // const SubAdminuser = await SubAdmin.findOne({ referralCode: referredbyCode })
        // if (!SubAdminuser) return res.status(404).json({ message: 'User not found' });
        // console.log(SubAdminuser);
        // Find the transaction
        const user = await User.findOne({ userId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        console.log(user);

        const transactionExists = await TransactionModel.find({ userId: user.userId, referredbyCode: user.referredbyCode }).sort({ createdAt: -1 });
        if (!transactionExists) return res.status(404).json({ message: "Transaction not found" });



        res.json({ transactionExists });
    } catch (error) {
        console.error("Error searching transactions:", error);
        res.status(500).json({ message: "Server error" });
    }
};




///////////////////////////////////////////////////////////////////////////

exports.getTransactionDepositTotals = async (req, res) => {
    try {
        const { referredbyCode } = req.body;

        // Get date ranges
        const now = new Date();
        const lastDay = new Date();
        lastDay.setDate(now.getDate() - 1);

        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 7);

        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 30);

        

        // Aggregate query
        const results = await Transaction.aggregate([
            {
                $match: {
                    referredbyCode: referredbyCode,
                    type: 0, // Only deposits
                    status: 0, // Accepted transactions only
                    datetime: { $gte: last30Days }, // Only fetch last 30 days' data
                },
            },
            {
                $project: {
                    amount: 1,
                    period: {
                        $cond: {
                            if: { $gte: ["$datetime", lastDay] },
                            then: "lastDay",
                            else: {
                                $cond: {
                                    if: { $gte: ["$datetime", last7Days] },
                                    then: "last7Days",
                                    else: "last30Days"
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$period",
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);



        // Initialize summary
        let summary = {
            lastDay: 0,
            last7Days: 0,
            last30Days: 0
        };
       
        results.forEach(item => {
            summary[item._id] = item.totalAmount;
        });

        res.json({ success: true, data: summary });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



///////////////////////////////////////////////////////////////////////////

exports.chatsSummary = async  (req, res) => {
    try {
        const { referredbyCode, startDate, endDate } = req.body;

        if (!referredbyCode) {
            return res.status(400).json({ message: "referredbyCode is required" });
        }

        // Convert startDate and endDate to Date objects
        const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
        const end = endDate ? new Date(endDate) : new Date();

        // Calculate last full day, last 7 days, and last 30 days
        const lastDay = new Date();
        lastDay.setDate(lastDay.getDate() - 1);
        lastDay.setHours(0, 0, 0, 0);

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        last7Days.setHours(0, 0, 0, 0);

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        last30Days.setHours(0, 0, 0, 0);

        // Filter for accepted transactions with the referredbyCode
        const filter = { referredbyCode, status: 0,type:0 };

        const totals = await Promise.all([
            // Last day total
            Transaction.aggregate([
                { $match: { ...filter, datetime: { $gte: lastDay } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            // Last 7 days total
            Transaction.aggregate([
                { $match: { ...filter, datetime: { $gte: last7Days } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            // Last 30 days total
            Transaction.aggregate([
                { $match: { ...filter, datetime: { $gte: last30Days } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            // Custom date range total
            Transaction.aggregate([
                { $match: { ...filter, datetime: { $gte: start, $lte: end } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$datetime" } }, total: { $sum: "$amount" } } },
                { $sort: { _id: 1 } }
            ]),
        ]);

        res.json({
            lastDayTotal: totals[0][0]?.total || 0,
            last7DaysTotal: totals[1][0]?.total || 0,
            last30DaysTotal: totals[2][0]?.total || 0,
            customDateData: totals[3] || [],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}
///////////////////////////////////////////////////////////////////////////

exports.getTransactionWidthrawTotals = async (req, res) => {
    try {
        const { referredbyCode } = req.body;

        // Get date ranges
        const now = new Date();
        const lastDay = new Date();
        lastDay.setDate(now.getDate() - 1);

        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 7);

        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 30);

        console.log("Referred by Code:", referredbyCode);

        // Aggregate query
        const results = await Transaction.aggregate([
            {
                $match: {
                    referredbyCode: referredbyCode,
                    type: 1, // Only deposits
                    status: 1, // Accepted transactions only
                    datetime: { $gte: last30Days }, // Only fetch last 30 days' data
                },
            },
            {
                $project: {
                    amount: 1,
                    period: {
                        $cond: {
                            if: { $gte: ["$datetime", lastDay] },
                            then: "lastDay",
                            else: {
                                $cond: {
                                    if: { $gte: ["$datetime", last7Days] },
                                    then: "last7Days",
                                    else: "last30Days"
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$period",
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        console.log("Results:", results);

        // Initialize summary
        let summary = {
            lastDay: 0,
            last7Days: 0,
            last30Days: 0
        };

        results.forEach(item => {
            summary[item._id] = item.totalAmount;
        });

        res.json({ success: true, data: summary });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
///////////////////////////////////////////////////////////////////////////

exports.totalDeposit = async (req, res) => {
    try {
        const { referredbyCode } = req.body;
        if (!referredbyCode) {
            return res.status(400).json({ error: "referredbyCode is required" });
        }

        const totalDeposit = await Transaction.aggregate([
            { $match: { referredbyCode: referredbyCode, type: 0, status: 1 } }, // Filter deposits & accepted transactions
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        
        res.json({ totalDeposit: totalDeposit.length > 0 ? totalDeposit[0].total : 0 });
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


///////////////////////////////////////////////////////////////////////////


exports.totalWidthraw = async (req, res) => {
    try {
        const { referredbyCode } = req.body;
        if (!referredbyCode) {
            return res.status(400).json({ error: "referredbyCode is required" });
        }

        const totalDeposit = await Transaction.aggregate([
            { $match: { referredbyCode: referredbyCode, type: 1, status: 1 } }, // Filter deposits & accepted transactions
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({ totalDeposit: totalDeposit.length > 0 ? totalDeposit[0].total : 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


///////////////////////////////////////////////////////////////////////////



















exports.getUserTransactionHistory = async (req, res) => {
    try {
        const { userId, referralCode } = req.body;
        const transactions = await Transaction.find({ userId: userId, referredByCode: referralCode });
        res.json({ transactions });
    } catch (error) {
        console.error("Error searching transactions:", error);
        res.status(500).json({ message: "Server error" });
    }

}


exports.GetAllUser_For_Sub_Admin = async (req, res) => {
    

    try {
        console.log(req.body);
        const { referralCode, userId, email, phone } = req.body;
        console.log(referralCode);
        if (!referralCode) {
            return res.status(400).json({ message: "Referral code is required" });
        }
        console.log(req.body.referralCode);
        // Check if SubAdmin exists
        const subAdminExists = await SubAdmin.findOne({ referralCode });
        console.log(subAdminExists)
        if (!subAdminExists) {
            return res.status(404).json({ message: 'SubAdmin not found' });
        }

        let query = {};

        // Only apply filters if provided
        if (userId) {
            query.userId = userId;
        }
        if (email) {
            query.email = email;
        }
        if (phone) {
            query.phone = phone;
        }

        // Fetch users using aggregation
        const users = await User.aggregate([
            // First, match the referralByCode
            { 
                $match: { referredbyCode: subAdminExists.referralCode }
            },

            { 
                $match: query 
            },
            {
                $project: {
                    userId: 1,
                    name: 1,
                    phone: 1,
                    balance: 1,
                    referredbyCode: 1,
                    referredCode: 1,
                    email: 1,
                    country: 1,
                    countryCode: 1,
                    isPhoneVerified: 1,
                    isEmailVerified: 1,
                    timestamp: 1,
                    last_game_id: 1,
                },
            },
        ]);
console.log(users)
        // if (users.length === 0) {
        //     return res.status(404).json({ message: 'No users found' });
        // }

        return res.json(users);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};






// const express = require('express');
// const mongoose = require('mongoose');
// const User = require('./models/User'); // আপনার User মডেল ইমপোর্ট করুন



// router.post('/deposit', 
//     exports.depositWIthBonus = async (req, res) => {
//     try {
//         const { userId, amount } = req.body;

//         if (!userId || !amount || amount <= 0) {
//             return res.status(400).json({ message: "Invalid deposit amount" });
//         }

//         const user = await User.findOne({ userId });

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // ৩.৫% বোনাস হিসাব
//         const bonusAmount = (amount * 3.5) / 100;
//         const totalBalance = user.balance + amount + bonusAmount;

//         user.balance = totalBalance;
//         user.bonus.bonusAmount += bonusAmount;
//         user.bonus.wageringRequirement += (bonusAmount * 10); // ১০x ওয়েজারিং রিকোয়ারমেন্ট

//         await user.save();

//         res.json({ message: "Deposit successful", balance: user.balance, bonus: user.bonus });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }









// Admin - Approve or Reject Withdraw Request
// router.post("/admin/withdraw-action", 
exports.adminWithdrawAction = async (req, res) => {
    try {
        const { transactionID, status } = req.body;
        const transaction = await Transaction.findOne({ transactionID });

        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        if (![1, 2].includes(status)) return res.status(400).json({ message: "Invalid status" });

        transaction.status = status;
        await transaction.save();

        if (status === Reject) { // If rejected, refund balance
            const user = await User.findOne(transaction.userId);
            user.balance += transaction.amount;
            await user.save();
        }

        res.status(200).json({ message: "Transaction updated", transaction });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}









///////////////////



exports.DepositsList = async (req, res) => {
    // console.log(req.body);
    try {
        const { referredbyCode } = req.body;
        console.log(referredbyCode);

        // Find the user based on the referredCode
        const users = await User.find({ referredbyCode: referredbyCode });
        console.log(users);
        // If user not found, return 404
        if (!users) {
            return res.status(404).json({ message: 'User not found' });
        }
        const transactions = await Transaction.find({ referredbyCode: referredbyCode, status: 0 });

        const transactionscount = await Transaction.find({ referredbyCode }).countDocuments();
        res.status(200).json({ transactionscount, transactions });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.WidthdrawListByUser = async (req, res) => {
    // console.log(req.body);
    try {
        const { referredbyCode } = req.body;
        console.log(referredbyCode);

        // Find the user based on the referredCode
        const users = await User.find({ referredbyCode: referredbyCode });
        console.log(users);
        // If user not found, return 404
        if (!users) {
            return res.status(404).json({ message: 'User not found' });
        }
        const transactions = await Transaction.find({ referredbyCode: referredbyCode, status: 0 });

        const transactionscount = await Transaction.find({ referredbyCode }).countDocuments();
        res.status(200).json({ transactionscount, transactions });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}



// Get list of active payment methods for user with time validation

exports.GetPaymentMethodsUser = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("User ID:", userId);

        // Validate User
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("User found:", user);

        // Get current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        // Use aggregation to filter active payment methods within time range
        const paymentMethods = await PaymentGateWayTable.aggregate([
            {
                $match: {
                    is_active: true,
                    referredbyCode: user.referredbyCode
                }
            },
            {
                $match: {
                    $expr: {
                        $and: [
                            { $lte: ["$startTotalMinutes", "$currentTotalMinutes"] },
                            { $gte: ["$endTotalMinutes", "$currentTotalMinutes"] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    gateway_name: 1,
                    gateway_Number: 1,
                    payment_type: 1,
                    image_url: 1,
                    start_time: 1,
                    end_time: 1,
                    is_active: 1
                }
            }
        ]);

        console.log("Available Payment Methods:", paymentMethods);

        return res.status(200).json({ paymentMethods });
    } catch (error) {
        console.error("Error retrieving payment methods:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};






exports.subAdminGetWayList = async (req, res) => {
    console.log(req.body);
    try {
        const { user_role, email, referralCode } = req.body;
        console.log(user_role, email, referralCode);

        // Find the user based on the referredCode
        const Getway = await PaymentGateWayTable.find({ user_role, email, referredbyCode: referralCode });
        const Getwaycount = await PaymentGateWayTable.find({ user_role, email, referredbyCode: referralCode }).countDocuments();;

        res.status(200).json({ Getwaycount, Getway });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}





///////////////////////////////////////

exports.AdminDepositsList = async (req, res) => {
    try {


        // Find the user based on the referredCode
        const users = await User.findOne({});

        // If user not found, return 404
        if (!users) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find transactions for the user


        const transactions = await Transaction.find({});

        // If no transactions are found, return an empty array
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this user' });
        }

        // Return the found transactions
        res.json(transactions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.WithdrawalsList = async (req, res) => {
    try {
        const users = await User.find({ "withdrawRequest": { $exists: true } }, 'userId name balance withdrawRequest');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}








// router.post('/update-bonus',
//     exports.updateBonus = async (req, res) => {
//   try {
//       const { userId, bonusAmount, wageringRequirement } = req.body;
//       const user = await User.findOne({ userId });

//       if (!user) return res.status(404).json({ message: "User not found" });

//       user.bonus.bonusAmount = bonusAmount;
//       user.bonus.wageringRequirement = wageringRequirement;
//       await user.save();

//       res.json({ message: "Bonus updated", bonus: user.bonus });
//   } catch (error) {
//       res.status(500).json({ message: "Internal server error" });
//   }
// }


// const express = require('express');
// const User = require('../models/User');

// const router = express.Router();

// নির্দিষ্ট ইউজারের টার্নওভার স্ট্যাটাস দেখার API
// router.get('/turnover-status/:userId',
//     exports.getTurnoverStatus = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const user = await User.findOne({ userId });

//         if (!user) return res.status(404).json({ message: "User not found" });

//         res.json({
//             userId: user.userId,
//             balance: user.balance,
//             bonusAmount: user.bonus.bonusAmount,
//             wageringRequirement: user.bonus.wageringRequirement,
//             turnoverCompleted: user.bonus.bonusAmount * user.bonus.wageringRequirement,
//         });

//     } catch (error) {
//         res.status(500).json({ message: "Internal server error" });
//     }
// }


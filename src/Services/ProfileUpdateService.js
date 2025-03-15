exports.profileUpdate = (req, res, dataModel) => {
    let reqBody = req.body;
    let userEmail = req.headers["email"]


    

    dataModel.updateOne({ email: userEmail }, { $set: reqBody }, { upsert: true })
        .then((data) => {
            console.log(data)
            if (!data) {
                res.status(400).json({ status: "fail", data: "err" })
            } else {
                res.status(200).json({ status: "success", data: data })
            }
        })


}
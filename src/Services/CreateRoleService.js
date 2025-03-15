exports.MakeAdmin = async (req, res) => {
    const email = req.params.email
    const reqEmail = req.headers.decoded
    const filter = { email: email }
    console.log(filter)
    const UpdateDoc = { $set: { role: "Admin" } }


    await UsersModel.findOneAndUpdate(filter, UpdateDoc, { upsert: true })
        .then((data) => {
            console.log(data)
            if (data) {
                res.status(200).json({ status: "success", data: data })
            } else {

                res.status(400).json({ status: "fail", data: "err" })
            }
        })
}
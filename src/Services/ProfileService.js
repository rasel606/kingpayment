exports.UserProfile = async (req, res) => {
    let userEmail = req.headers["email"]

    const data = await UsersModel.aggregate([
        { $match: { email: userEmail } },
        {
            $project: {
                email: 1,
                firstName: 1,
                photo: 1,
                mobile: 1,
                address: 1
            }
        }
    ])
    if (!data) {
        res.status(400).json({ status: "fail", data: "err" })
    } else {
        res.status(200).json({ status: "success", data: data })
    }

}
exports.removeAdmin = async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  console.log(filter);
  const UpdateDoc = { $set: { role: "user" } };

  await UsersModel.findOneAndUpdate(filter, UpdateDoc, { upsert: true }).then(
    (data) => {
      if (!data) {
        res.status(400).json({ status: "fail", data: "err" });
      } else {
        res.status(200).json({ status: "success", data: data });
      }
    }
  );
};

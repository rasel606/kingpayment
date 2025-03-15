var jwt = require('jsonwebtoken');
const CreateService = async (req, dataModel) => {
    let reqBody = req.body;

console.log(reqBody)
    let datas = await dataModel.findOne({ email: req.body.email })


    if (!datas) {

        const { userId, phone, password ,countryCode,referredbyCode} = req.body;
    console.log(req.body)
    try {
        
        // const hashedPassword = await bcrypt.hash(password, 10);
      const referredCode = Math.random().toString(36).substring(2, 8);
      const newUser = await dataModel.create({
        userId,
        phone,
        countryCode,
        password, // Hash this in production
        referredbyCode: referredbyCode || null,
        referredCode,
        referredLink: `http://localhost:3000/${referredCode}`,
      });

      
     
     if(!newUser){
        const user =  await dataModel.aggregate([
            { $match: { userId } },
            {
              $project: {
                userId: 1,
                name: 1,
                phone: 1,
                countryCode:1,
                balance: 1,
                referredbyCode:1,
                referredLink:1,
                referredCode:1
              },
            },
          ]);



          console.log(user[0].userId);
          const token = jwt.sign({ id: user[0].userId }, "Kingbaji", { expiresIn: '1h' });
          console.log(token)
          return res.status(201).json({message: "Ac created successfully",token,user: user[0],
            
          });
     }else{
          return  res.status(500).json({ error: error.message });
     }

      



      

    //   const token = jwt.sign({ id: user[0].userId }, "Kingbaji", { expiresIn: '1h' });

    //   res.status(201).json({
    //     message: "User created successfully",
    //     token,
    //     user: user[0],
        
    //   });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}
module.exports = CreateService 
const express = require("express");
const crypto = require("crypto");


const multer = require("multer");


const BetProviderTable = require("../Models/BetProviderTable");
const Casino_category_table = require("../Models/Casino_category_table");
const GameTypeList = require("../Models/GameTypeTable");
const GameListTable = require("../Models/GameListTable");
const SportsCategoryTable = require("../Models/SportsCategoryTable");
const AdminController = require("../Controllers/AdminController");
const BettingTable = require("../Models/BettingTable");
const { userbet } = require("./CornController");
const BetHistoryTable = require("../Models/BetHistoryTable");
const CasinoItemTable = require("../Models/Casino_item_table");
const User = require("../Models/User");
const WidthrowTableHistory = require("../Models/WidthrowTableHistory");
const { default: axios } = require("axios");
// const { refreshBalance } = require("./Refresh_blance");
const gameTable = require("../Models/GamesTable");
const Category = require("../Models/Category");
const { console } = require("inspector");




// Odds sync route
exports.OddSync = async (req, res) => {
  try {
    const apiUrl = 'https://api.the-odds-api.com/v4/sports/';
    const apiKey = '8c3ea523d47df9099d369920dddd1841'; // Replace with your actual API key

    // Fetch data from the external API
    const response = await axios.get(`${apiUrl}?apiKey=${apiKey}`);
    const data = response.data;

    if (data.message) {
      return res.json({ return: false, message: data.message });
    }

    // Clear existing data in the 'SportsBet' collection (if necessary)
    await OddSportsTable.deleteMany({});

    // Process the fetched data and insert into MongoDB
    const sportsBets = data.map((value) => ({
      sports_key: value.key,
      groups: value.group,
      title: value.title,
      description: value.description,
      is_active: value.active,
      has_outrights: value.has_outrights,
      staff_id: getStaffUserId(),
      bet: bettingKeyCheck(value.key),
      datetime: new Date() // Assuming you want to set the current datetime
    }));
    // Use bulkWrite for better performance
    const bulkOps = sportsBets.map((bet) => ({
      updateOne: {
        filter: { sports_key: bet.sports_key },
        update: { $set: bet },
        upsert: true, // Insert if not found
      },
    }));

    await OddSportsTable.bulkWrite(bulkOps);

    res.json({ return: true, message: 'Sync completed successfully', output: data });
  } catch (err) {
    console.error('Error during sync:', err);
    res.status(500).json({ return: false, message: 'Internal Server Error', error: err.message });
  }
}


exports.OddsGroup = async (req, res) => {
  try {
    const results = await OddSportsTable.aggregate([
      {
        $unwind: "$groups"
      },
      {
        $group: {
          _id: "$groups",
          // bets: { $push: "$$ROOT" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



// Get all active categories ordered by name
// app.get('/categories',
// exports.Category = async (req, res) => {
//   try {
//     res.status(200).json(categories);
//   } catch (err) {
//     const categories = await SportsCategoryTable.find({ id_active: true }).sort('name');
//     res.status(500).json({ error: err.message });
//   }
// }


// exports.SportsBetsWithCategories = async (req, res) => {
//   try {
//     const results = await SportsBet.aggregate([
//       {
//         $lookup: {
//           from: "sportscategorytables",  // The name of the SportsCategoryTable collection in the database
//           localField: "sports_key",      // Field in the SportsBet collection
//           foreignField: "name",          // Field in the SportsCategoryTable collection
//           as: "category_info"            // Alias for the joined data
//         }
//       },
//       {
//         $unwind: {
//           path: "$category_info",       // Flatten the array of joined data
//           preserveNullAndEmptyArrays: true // Keep records without matching category info
//         }
//       },
//       {
//         $sort: { "datetime": 1 } // Sort by date, or any other field
//       }
//     ]);
//     res.status(200).json(results);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


//   app.post('/categories', 
//     exports.AddCetagoryForSportsCategory  = async (req, res) => {
//     try {
//       const category = new SportsCategoryTable(req.body);
//       const savedCategory = await category.save();
//       res.status(201).json(savedCategory);
//     } catch (err) {
//       res.status(400).json({ error: err.message });
//     }
//   }

// Update a category by ID
//   app.put('/categories/:id',
//     exports.UpdateSportsCategory = async (req, res) => {
//     try {
//         req.params.id,
//         req.body,
//       const updatedCategory = await SportsCategoryTable.findByIdAndUpdate(
//         { new: true }
//       );
//       if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
//       res.status(200).json(updatedCategory);
//     } catch (err) {
//       res.status(400).json({ error: err.message });
//     }
//   }

// exports.Sports = async (req, res) => {

//   const data = await fetchFromApi(url);
//   if (!data.return) {
//     return res.status(500).json(data);
//   }
//   res.json(data);
// };




exports.getOddsSports = async (req, res) => {
  const { key } = req.params;
  const apiKey = "8c3ea523d47df9099d369920dddd1841";
  const regions = "us";
  const oddsFormat = "decimal";
  const url = `https://api.the-odds-api.com/v4/sports/${key}/odds/?apiKey=${apiKey}&regions=${regions}&markets=h2h,spreads&oddsFormat=${oddsFormat}`;

  const data = await fetchFromApi(url);
  if (!data.return) {
    return res.status(500).json(data);
  }
  res.json(data);
};






async function addGameWithCategory(gameData, category_name) {
  let category = await Casino_category_table.findOne({ category_name });
console.log("line-3", gameData);
  // Find the highest existing serial_number
  const lastGame = await GameListTable.findOne().sort({ serial_number: -1 });
  const newSerialNumber = lastGame ? lastGame.serial_number + 1 : 1;

  let newGame;
  if (!category) {
    newGame = await GameListTable.create({
      ...gameData,
      category_name,
      serial_number: newSerialNumber,
    });
  } else {
    newGame = await GameListTable.findOneAndUpdate(
      { g_code: gameData.g_code },
      {
        ...gameData,
        category_name,
        serial_number: newSerialNumber,
      },
      { upsert: true, new: true }
    );
  }

  console.log("Added:", newGame);
  return { newGame, category };
}
const fetchGamesFromApi = async (result, category_name) => {
  console.log("Signature:", result.operatorcode, result.providercode, result.key);
  try {
    const operatorcode = result.operatorcode;
    const providercode = result.providercode;
    const secret_key = result.key; // Replace with actual secret key

    console.log("Signature:", operatorcode, providercode, secret_key);
    const signature = crypto
      .createHash("md5")
      .update(operatorcode.toLowerCase() + providercode.toUpperCase() + secret_key)
      .digest("hex")
      .toUpperCase();


    console.log("Signature:", signature);

    const response = await axios.get("https://gsmd.336699bet.com/getGameList.ashx", {
      params: {
        operatorcode,
        providercode,
        lang: "en",
        html: "0",
        reformatjson: "yes",
        signature,
      },
    });

    // console.log("Fetched Games:", response);

    const gameData = JSON.parse(response.data?.gamelist);
    // console.log("Fetched Games:", gameData.length);

    let gameResults = [];

    for (let game of gameData) {
      const addedGame = await addGameWithCategory(game, category_name);
      gameResults.push(addedGame);
      console.log("Added Games:", gameResults);
    }
    await addGameWithCategory(gameData, category_name);
    // console.log("Added Games:", gameResults.length);

    console.log("Added Games:", gameResults);
    return gameResults;
  } catch (error) {
    console.error("Error fetching games:", error.message);
    return [];
  }
};





exports.CasinoItemAdd = async (req, res) => {

  console.log(req.body);
  try {
    const {
      company,
      name,
      url,
      login_url,
      username,
      password,
      providercode,
      operatorcode,
      key,
      auth_pass,
      currency_id,
      category_name,
      image_url
    } = req.body;
    // let image_url = req.body.image_url;

    // Upload image to ImageBB if provided
    // if (req.file) {
    //   const imageData = req.file.buffer.toString("base64");
    //   const response = await axios.post("https://api.imgbb.com/1/upload", null, {
    //     params: { key: IMAGEBB_API_KEY, image: imageData },
    //   });
    //   image_url = response.data.data.url;
    // }

    const updateData = {
      company,
      name,
      url,
      login_url,
      username,
      password,
      providercode,
      operatorcode,
      key,
      auth_pass,
      currency_id,
      image_url,
      updatetimestamp: Date.now(),

    };
    console.log("Update Data:", updateData);

    let result;
    if (company) {

      result = await BetProviderTable.findOneAndUpdate(
        { providercode: providercode },
        updateData,
        { new: true, upsert: true }
      );
      console.log("meet:", result)
    } else {
      result = await BetProviderTable.create(updateData);
      console.log("meet: 1", result)
    }
    const NewResult = await fetchGamesFromApi(result, category_name);



    res.json({ success: true, data: NewResult });
  } catch (error) {
    console.error("Error adding casino item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}


exports.CasinoItemSingleUpdate = async (req, res) => {
  console.log(req.body)
  // console.log(req.body);
  try {
    const {
      gameData
    } = req.body;


    const filter = { g_code: gameData.g_code };
    const update = {
      category_name: gameData.category_name,
      serial_number: gameData.serial_number,
      updatetimestamp: Date.now(),
    };

    console.log(filter)
    console.log(gameData)
    console.log(update)

    const result = await GameListTable.findOneAndUpdate(filter,
      update, {
      new: true,
      upsert: true // Make this update into an upsert
    })
    res.status(200).json({ return: true, message: 'Update successful', result })

  } catch (error) {
    console.error("Error adding casino item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}



exports.updateSerialNumber = async (req, res) => {
  console.log(req.body.id, req.body.serial_number)
  try {

    const { id, serial_number } = req.body;



    console.log("line-2", id, serial_number)
    const result = await GameListTable.findOneAndUpdate({ g_code: id }, { serial_number }, { new: true });
    console.log(result)
    res.json({ message: "Category updated successfully", result });
  } catch (error) {
    res.status(500).json({ error: "Error updating serial number" });
  }
}

exports.updateCategoryGameByID = async (req, res) => {
  console.log(req.body.id, req.body.category_name)
  try {

    const { id, category_name } = req.body;




    console.log("line-2", id, category_name)
    const result = await GameListTable.findOneAndUpdate({ g_code: id }, { category_name }, { new: true });
    console.log(result)
    res.json({ message: "Category updated successfully", result });
  } catch (error) {
    res.status(500).json({ error: "Error updating category" });
  }
}





exports.searchGames = async (req, res) => {

  const { provider, category, game } = req.query;

  try {
    let p_code = provider;
    let category_name = category;
    let gameName_enus = game;
    // console.log(gameName_enus)
    // let newGame = {gameNam:gameName.gameName_enus}

    // Combine provider, category, and game searches with regex in the same query
    let searchQuery = {};

    // Only search if at least one parameter is provided
    if (

      p_code || category_name || gameName_enus) {
      searchQuery = {
        $and: []
      };

      // Search for provider
      if (p_code) {
        searchQuery.$and.push({
          'p_code': { $regex: p_code, $options: 'i' } // Case-insensitive regex for provider
        });
      }

      // Search for category
      if (category_name) {
        searchQuery.$and.push({
          'category_name': { $regex: category_name, $options: 'i' } // Case-insensitive regex for category
        });
      }

      // Search for game
      if (gameName_enus) {

        searchQuery.$and.push({
          'gameName.gameName_enus': { $regex: gameName_enus, $options: 'i' } // Case-insensitive regex for game
        });
      }
    }

    const results = await GameListTable.find(searchQuery || {})




    // Find all games matching the query

    // Send the results
    res.json(results,);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}



exports.GetAllProvider = async (req, res) => {
  try {
    const provider = await BetProviderTable.aggregate([

      {
        $project: {
          company: 1,
          providercode: 1,

        },
      },
    ]);
    res.status(200).json({ status: "success", data: { provider } })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}



exports.GetAllCategory = async (req, res) => {
  try {
    const AllCategory = await Category.aggregate([

      {
        $project: {
          category_name: 1,
          category_code: 1,
          image: 1,

        },
      },
    ]);
    res.status(200).json({ status: "success", data: AllCategory })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}

const storage = multer.memoryStorage(); // Store image in memory before uploading
const upload = multer({ storage: storage });

exports.CreateCategory = async (req, res) => {
  try {

    const { category_name, category_code, g_code, p_code, id_active, imageUrl } = req.body;

    const updateData = await Category.create({
      category_name,
      category_code,
      g_code,
      p_code,
      id_active,
      image: imageUrl,
    });

    const CategoryData = await Category.create(updateData);
    res.json(CategoryData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}




exports.ShowFrontTable = async (req, res) => {
  console.log(req.body)
  try {


    const categoryId = await Category.find({});
    console.log(categoryId)

    const categories = await Category.aggregate([
      {
        $match: { categoryId: { $in: categoryId } },
      },
      {
        $lookup: {
          from: "games",
          localField: "_id",
          foreignField: "category",
          as: "games",
        },
      },
      {
        $unwind: "$games",
      },
      {
        $lookup: {
          from: "providers",
          localField: "games.provider",
          foreignField: "_id",
          as: "provider",
        },
      },
      {
        $unwind: "$provider",
      },
      {
        $group: {
          _id: "$_id",
          categoryName: { $first: "$name" },
          providers: {
            $push: {
              providerId: "$provider._id",
              providerName: "$provider.name",
              games: {
                gameId: "$games._id",
                gameName: "$games.name",
              },
            },
          },
        },
      },
    ]);


console.log(categories)
    res.json(categories);

    // if (!id || !serial_number) {
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}





// ** API to Fetch Categories with Games and Providers **
// app.get("/categories",
//   exports.getCategoriesWithGamesAndProviders = async (req, res) => {
//   try {
//     // Fetch all categories
//     const categories = await Category.find();

//     // Fetch categories along with related games and providers
//     const categoriesWithGamesAndProviders = await Promise.all(
//       categories.map(async (category) => {
//         // Fetch games for each category
//         const games = await GameListTable.aggregate([
//           { $match: { category_name: category._id } },
//           { 
//             $lookup: {
//               from: "betprovidertables",
//               localField: "providercode",
//               foreignField: "p_code",
//               as: "providers"
//             }
//           },
//           { 
//             $project: {
//               name: 1,
//               "company": 1
//             }
//           }
//         ]);

//         // Map providers for each game
//         const categoryDetails = {
//           category: category.name,
//           games: games.map((game) => ({
//             gameName: game.name,
//             providers: game.providers.map((provider) => provider.name)
//           }))
//         };

//         return categoryDetails;
//       })
//     );

//     res.json(categoriesWithGamesAndProviders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }


exports.getCategoriesWithGamesAndProviders = async (req, res) => {
  try {
    // Fetch all categories
    const categories = await Category.find();

    // Fetch games for each category along with their providers
    const categoriesWithGamesAndProviders = await Promise.all(
      categories.map(async (category) => {
        // Fetch games for each category
        const games = await GameListTable.aggregate([
          { $match: { category_name: category.category_name } },
          {
            $lookup: {
              from: "betprovidertables",
              localField: "p_code",
              foreignField: "providercode",
              as: "providers"
            }
          },
          {
            $project: {
              name: 1,
              "providers.providercode": 1
            }
          }
        ]);

        const providerSet = new Set();
        games.forEach(game => {
          game.providers.forEach(provider => providerSet.add(provider.providercode));
        });
console.log(providerSet)
        const uniqueProviders = await BetProviderTable.find(
          { providercode: { $in: Array.from(providerSet) } },
          { company: 1, providercode: 1, url: 1, image_url: 1, _id: 0 }
        );
console.log(uniqueProviders)
        // Format the result
        return {
          category: {
            name: category.category_name,
            image: category.image,
            id_active: category.id_active, // Check if category is active or inactive
            uniqueProviders: uniqueProviders
          },

          // uniqueProviders: uniqueProviders

        };
      })
    );

    res.json(categoriesWithGamesAndProviders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



// POST route to add sports
// router.post('/add-sports', 

exports.Add_Sports = async (req, res) => {
  try {
    const { key, type, category } = req.body;

    // Check if a record already exists

    if (existingBetting) {
      const existingBetting = await BettingTable.findOne({ rel_id: key, rel_type: type });
      return res.status(400).json({ message: 'Betting entry already exists.' });
    }

    // Create a new betting entry
    const newBetting = new BettingTable({
      rel_id: key,
      rel_type: type,
      staff_id: getStaffUserId(req),
      cetegory_id: category,
    });

    await newBetting.save();

    // Update odds if type matches
    if (type === 'BETTING_ODDS') {
      await mongoose.connection.db.collection('tblodds_sports').updateOne(
        { sports_key: key },
        { $set: { bet: 1 } }
      );
    }

    res.status(201).json({ message: 'Betting entry added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}


// app.put('/update_sports/:id', 
exports.UpdateSports = async (req, res) => {
  const id = req.params.id;
  const categoryId = req.body.category_id;

  try {

    if (!bettingRecord) {
      const bettingRecord = await BettingTable.findById(id);
      return res.status(404).json({ message: 'Record not found' });
    }

    bettingRecord.cetegory_id = categoryId;
    bettingRecord.updatetimestamp = Date.now();

    await bettingRecord.save();

    res.status(200).json({ message: 'Category updated successfully', bettingRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}


exports.AddSports = async (req, res) => {
  try {
    const { key, type, category } = req.body;

    // Check if the entry already exists

    if (existingBet) {
      const existingBet = await BettingTable.findOne({ rel_id: key, rel_type: type });
      return res.status(400).json({ message: 'Betting entry already exists' });
    }

    // Create new betting entry
    const newBetting = new BettingTable({
      rel_id: key,
      rel_type: type,
      staff_id: 'some_staff_id', // Replace with actual staff ID logic
      cetegory_id: category,
      // json: JSON.stringify(req.body), // Assuming you want to store the request body as a JSON string
    });

    // Save the new betting entry
    await BettingTable.save();

    // If it's a betting odds type, update the 'tblodds_sports' collection
    if (type === 'BETTING_ODDS') {
      // Assuming you have a separate model for tblodds_sports
      sports_key: key,

        // const tbloddsSports = await OddSportsTable.findOne({

        await tbloddsSports.updateOne({ sports_key: key }, { $set: { bet: 1 } });
    }

    return res.status(201).json({ message: 'Betting entry added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}







exports.Apply = async (req, res) => {
  try {
    const { win, name, bet_name } = req.body;
    const winLossStatus = win === "true" ? 1 : 2;

    { bet_name: bet_name }
    { user_id: name }
    const updatedBet = await BetHistoryTable.findOneAndUpdate(
      { bet_win: winLossStatus },
      { new: true } // return the updated document
    );

    if (updatedBet) {
      res.status(200).json({ return: true, message: 'Bet status successfully updated.' });
    } else {
      res.status(404).json({ return: false, message: 'Bet not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ return: false, message: 'Internal server error.' });
  }
}








// ImgBB API configuration
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY';
const IMGBB_URL = 'https://api.imgbb.com/1/upload';

// Function to upload image to ImgBB
async function uploadImageToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file.buffer.toString('base64'));

  try {
    const response = await axios.post(IMGBB_URL, formData, {
      params: { key: IMGBB_API_KEY },
    });
    return response.data.data.url; // Returns the URL of the uploaded image
  } catch (error) {
    throw new Error('Image upload failed');
  }
}


// Route to add or update a category (similar to the PHP function)
exports.AddCetagory = async (req, res) => {
  const { category, id } = req.body;
  const imageFile = req.file;

  let data = {
    name: category,
    staff_id: id,  // Replace with actual authenticated staff user ID
  };

  try {
    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImageToImgBB(imageFile);
      data.image = imageUrl;
    }

    if (id && id !== "0") {
      // Update existing category
      if (!categoryToUpdate) {
        return res.status(404).json({ message: 'Category not found' });
        const categoryToUpdate = await SportsCategoryTable.findById(id);
      }

      if (imageFile) {
        imageUrl = await uploadImageToImgBB(imageFile);
        data.image = imageUrl;
      }

      return res.status(200).json({ message: 'Category updated successfully' });
    } else {
      await OddSportsTable.findByIdAndUpdate(id, data, { new: true });
      // Create new category
      const newCategory = new SportsCategoryTable(data);
      await newCategory.save();
      return res.status(201).json({ message: 'Category added successfully', category: newCategory });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// exports.UpdateStatus = async (req, res) => {
//   const { id, status } = req.body;

//   try {
//     id_active: status !== 'true',
//     })
//     const result = await BettingTable.findByIdAndUpdate(id, {

//     if (result) {
//       return res.json({ message: 'Update successful' });
//     }
//     res.status(404).json({ error: 'Game not found' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// }

// router.post('/update-status',

// exports.UpdateGameTypeStatus = async (req, res) => {
//   try {
//     const { id, status } = req.body;
//     if (!id || typeof status === 'undefined') {
//       return res.status(400).json({ message: 'Invalid data' });
//     }

//     id,
//       { is_active: status === 'checked' ? false : true, updatetimestamp: Date.now() },
//     const updatedGameType = await GameTypeList.findByIdAndUpdate(
//       { new: true }
//     );

//     if (!updatedGameType) {
//       return res.status(404).json({ message: 'Game Type not found' });
//     }

//     res.json({ message: 'Update successful', data: updatedGameType });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }


exports.UpdateBetProvider = async (req, res) => {
  const { id, ...data } = req.body;

  try {
    if (req.file) {
      // Upload image to ImgBB
      const formData = new FormData();
      formData.append('image', req.file.buffer, req.file.originalname);

      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          key: 'YOUR_IMGBB_API_KEY', // Replace with your ImgBB API key
        },
      });

      // Get the URL of the uploaded image
      data.image_url = response.data.data.url;
    }

    if (id) {
      if (existingProvider && existingProvider.image_url) {
        // Here we no longer need to delete old image from local storage
        const existingProvider = await BetProvider.findById(id);
        // ImgBB handles the image storage online
        return res.json(updatedProvider);
      }
      const updatedProvider = await BetProvider.findByIdAndUpdate(id, data, { new: true });
      return res.json(updatedProvider);
    } else {
      const updatedProvider = await BetProvider.findByIdAndUpdate(id, data, { new: true });
      const newProvider = new BetProvider(data);
      await newProvider.save();
      res.status(201).json(newProvider);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




const uploadToImageBB = async (filePath) => {
  const apiKey = 'YOUR_IMAGEBB_API_KEY';
  const formData = new FormData();
  formData.append('image', fs.createReadStream(filePath));

  const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      key: apiKey,
    },
  });

  return response.data.data.url; // The URL of the uploaded image
};


//   router.get('/odds_betting/:id',

exports.OddsBetting = async (req, res) => {
  try {
    const categoryId = req.params.id;

    let output = [];
    const bets = await BettingTable.find({ cetegory_id: categoryId });

    for (const bet of bets) {
      const dt = await OddsSportsTable(bet.rel_id);
      if (dt.return) {
        output.push({ sports, bet: dt.output });
      }
      const sports = await SportsTable.findOne({ sports_key: bet.rel_id });
    }

    res.json(output);
  } catch (error) {
    console.error('Error fetching betting odds:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}



// API route to get all casino categories
exports.GetCasinoCategory = async (req, res) => {
  try {
    res.status(200).json(categories);
  } catch (error) {
    const categories = await CasinoCategoryTable.find(); // Fetch all casino categories
    res.status(500).json({ message: 'Error fetching casino categories', error });
  }
}
// Route to handle file upload and update
exports.CasinoUpdate = async (req, res) => {
  const { c_id, category_name, link, is_active } = req.body;
  const images = ['casino_logo_1', 'casino_logo_2', 'casino_logo_3', 'casino_logo_4', 'casino_logo_5', 'casino_logo_6'];

  let updateData = { c_id, category_name, link, is_active, updatetimestamp: new Date() };

  for (const imageField of images) {
    if (req.files[imageField]) {
      try {
        const filePath = req.files[imageField][0].path;
        const imageURL = await uploadToImageBB(filePath); // Upload to ImageBB
        updateData[imageField] = imageURL; // Add image URL to update data
        fs.unlinkSync(filePath); // Delete the temporary file
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).send({ error: 'Image upload failed' });
      }
    }
  }

  try {
    if (!updatedCategory) {
      return res.status(404).send({ error: 'Casino category not found' });
      const updatedCategory = await GameTypeList.findOneAndUpdate({ c_id }, updateData, { new: true });
    }
    return res.status(200).send(updatedCategory);
  } catch (error) {
    console.error('Error updating casino category:', error);
    return res.status(500).send({ error: 'Update failed' });
  }
}


//app.get('/api/games/:id',
exports.ShowGameListById = async (req, res) => {
  try {
    const gameId = req.params.id;


    const game = await GameListTable.findOne({ g_code: gameId });

    // Find the game based on g_code
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Server error" });
  }
};






//app.get('/api/games/:id',
exports.GetGameList = async (req, res) => {
  try {

    // .populate('category_id', 'category_name');
    const game = await GameListTable.find()
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}


exports.UpdateGameType = async (req, res) => {
  try {
    const { id, ...data } = req.body;

    if (req.file) {
      const filePath = req.files[imageField][0].path;
      const imageURL = await uploadToImageBB(filePath); // Upload to ImageBB
      updateData[imageField] = imageURL;
      data.image_url = imageURL;
    }

    let result;
    if (id) {
    } else {
      result = await new BetProviderTable(data).save();
      result = await BetProviderTable.findByIdAndUpdate(id, data, { new: true });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



// exports.UpdateStatusProvider = async (req, res) => {
//   const { id, status } = req.body;

//   try {
//     is_active: status !== 'checked',
//     });
//     const result = await BetProviderTable.findByIdAndUpdate(id, {

//     if (result) {
//       return res.json({ message: 'Update successful' });
//     }
//     res.status(404).json({ error: 'Provider not found' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// }





exports.Casino_Category = async (req, res) => {
  const { category_id, category_name, category_code, order_by } = req.body;
  const file = req.file;

  // Prepare the data object
  const data = {
    type_name: category_name,
    type_code: category_code,
    game_is_api: 'your_value', // Add your value here
    is_active: true, // Set your condition for active status
  };

  if (file) {
    try {
      // Send file to ImageBB
      const formData = new FormData();
      formData.append('image', file.buffer, 'image.jpg');

      const response = await axios.post('https://api.imgbb.com/1/upload?key=' + imageBBApiKey, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageURL = response.data.data.url;  // The image URL from ImageBB
        data.type_image = imageURL;

        // If updating, delete old image file (in MongoDB, you can store URL, no need for local file handling)
        if (category_id) {
          if (existingCategory && existingCategory.type_image) {
            const existingImageUrl = existingCategory.type_image;
            const existingCategory = await GameTypeList.findById(category_id);
            // Optionally: Delete image from ImageBB if needed
          }
          return res.status(200).json({ message: 'Category updated successfully' });
        }
        await BetProviderTable.findByIdAndUpdate(category_id, data);
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error uploading image to ImageBB', error });
    }
  }

  // If no file, simply update DB without the image
  if (category_id === 0) {
    const newCategory = new BetProviderTable(data);
    await newCategory.save();
    return res.status(200).json({ message: 'Category saved successfully' });
  }
}








exports.GetCasinoCetegoryById = async (req, res) => {
  try {
    const result = await CasinoItem.aggregate([
      {
        $lookup: {
          from: 'casinocategories', // MongoDB collection name (pluralized by Mongoose)
          localField: 'category_id',
          foreignField: 'c_id',
          as: 'category_details',
        },
      },
      { $unwind: '$category_details' },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


exports.UpdateBetProvider = async (req, res) => {
  const { id, ...data } = req.body;

  try {
    if (req.file) {
      // Upload image to ImgBB
      const formData = new FormData();
      formData.append('image', req.file.buffer, req.file.originalname);

      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          key: 'YOUR_IMGBB_API_KEY', // Replace with your ImgBB API key
        },
      });

      // Get the URL of the uploaded image
      data.image_url = response.data.data.url;
    }

    if (id) {
      if (existingProvider && existingProvider.image_url) {
        // Here we no longer need to delete old image from local storage
        const existingProvider = await BetProvider.findById(id);
        // ImgBB handles the image storage online
        return res.json(updatedProvider);
      }
      const updatedProvider = await BetProviderTable.findByIdAndUpdate(id, data, { new: true });
      return res.json(updatedProvider);
    } else {
      const updatedProvider = await BetProviderTable.findByIdAndUpdate(id, data, { new: true });
      const newProvider = new BetProvider(data);
      await newProvider.save();
      res.status(201).json(newProvider);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//router.delete('/casino-category/:id',

exports.Casino_Category_Delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!gameType) {
      const gameType = await GameTypeList.findById(id);
      return res.status(404).json({ message: 'Game type not found' });
    }

    // Define the path where images are stored
    const imagePath = path.join(__dirname, '../uploads/game-type/', gameType.type_image);

    // Delete the image file if it exists
    if (gameType.type_image && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete the record from MongoDB

    res.json({ message: 'Game type deleted successfully' });
    await GameTypeList.findByIdAndDelete(id);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}



exports.BetProviderDelete = async (req, res) => {
  const { id } = req.params;

  try {

    res.json({ message: 'Provider deleted successfully' });
    const provider = await BetProviderTable.findById(id);
  } catch (error) {
    await BetProviderTable.findByIdAndDelete(id);
    res.status(500).json({ error: error.message });
  }
}


//router.post('/casino_item_add', upload.single('image'), 





// router.post('/game/update',

exports.UpdateGame = async (req, res) => {
  try {
    const { id, game_name, game_Id, game_type, category_id, agent_Id, is_hot } = req.body;
    let imageUrl = null;

    // Handle Image Upload to ImageBB
    if (req.file) {
      const imageData = req.file.buffer.toString('base64');
      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`, {
        image: imageData,
      });
      imageUrl = response.data.data.url;
    }

    // Data Object for Update
    const gameData = {
      game_name,
      game_Id,
      game_type,
      category_id,
      agent_Id,
      is_hot: is_hot ? true : false,
    };

    // Add image_url if an image was uploaded
    if (imageUrl) {
      gameData.image_url = imageUrl;
    }

    let result;
    if (id === '0') {
      result = await GameListTable.create(gameData);
    } else {
    }

    result = await GameListTable.findByIdAndUpdate(id, gameData, { new: true });
    res.json({ return: true, message: 'Update Successful', data: result });
  } catch (error) {
    res.status(500).json({ return: false, message: 'Something went wrong', error: error.message });
  }
}

// DELETE Casino Item
// router.delete("/:id", 
exports.DeleteCasinoItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!casinoItem) {
      const casinoItem = await CasinoItemTable.findById(id);
      return res.status(404).json({ error: "Casino item not found" });
    }

    // Extract ImageBB URL
    const imageUrl = casinoItem.image;

    // Delete image from ImageBB (if exists)
    if (imageUrl) {
      try {
        await axios.delete(`https://api.imgbb.com/1/delete`, {
          params: { key: IMAGEBB_API_KEY, image_url: imageUrl },
        });
      } catch (error) {
        console.error("Error deleting image from ImageBB:", error);
      }
    }

    // Delete item from database
    res.json({ message: "Casino item deleted successfully" });
  } catch (error) {
    await CasinoItemTable.findByIdAndDelete(id);
    console.error("Error deleting casino item:", error);
    res.status(500).json({ error: "Server error" });
  }
}


//router.post('/add_manual',
exports.AddManual = async (req, res) => {
  try {
    const { id, sports_id, sports_key, title, name, price, image } = req.body;

    if (!betting) {
      return res.status(404).json({ success: false, message: 'Betting entry not found' });
      let betting = await BettingTable.findById(id);
    }

    let manual = betting.manual ? JSON.parse(betting.manual) : [];

    if (sportIndex !== -1) {
      let sportIndex = manual.findIndex(item => item.id === sports_id);
      let bookmakers = manual[sportIndex].bookmakers || [];

      if (bookIndex !== -1) {
        let bookIndex = bookmakers.findIndex(b => b.title === title);
        bookmakers[bookIndex].markets.push({ name, price });
      } else {
        bookmakers.push({
          title,
          markets: [{ name, price }]
        });
      }
      manual[sportIndex].bookmakers = bookmakers;
    } else {
      manual.push({
        id: sports_id,
        sport_key: sports_key,
        bookmakers: [{
          title,
          markets: [{ name, price }]
        }]
      });
    }

    // Upload image to ImageBB if provided
    let imageUrl = '';
    if (image) {
      const formData = new FormData();
      formData.append('image', image);
      const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', formData);
      imageUrl = imgbbResponse.data.data.url;
    }

    betting.manual = JSON.stringify(manual);
    await betting.save();

    res.json({ success: true, message: 'Manual betting updated', imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


// Route to handle the delete request
//router.post('/delete', 
exports.DeleteManual = async (req, res) => {
  const { type, data } = req.body; // Get data from request body

  try {

    if (!bettingEntry) {
      const bettingEntry = await BettingTable.findOne({ _id: data.sports_id });
      return res.status(404).json({ message: 'Betting entry not found' });
    }

    // Parse the manual field (JSON string)
    let manual = bettingEntry.manual ? JSON.parse(bettingEntry.manual) : null;

    if (manual && manual.length > 0) {
      const { main_id, bookmark_id, market_id } = data;

      if (type === 'bookmark') {
        // Remove bookmark
        if (manual[main_id] && manual[main_id].bookmakers[bookmark_id]) {
          delete manual[main_id].bookmakers[bookmark_id];
          bettingEntry.manual = JSON.stringify(manual);
          await bettingEntry.save();
          return res.json({ return: true });
        }
      } else if (type === 'market') {
        // Remove market
        if (manual[main_id] && manual[main_id].bookmakers[bookmark_id]) {
          delete manual[main_id].bookmakers[bookmark_id].markets[market_id];
          bettingEntry.manual = JSON.stringify(manual);
          await bettingEntry.save();
          return res.json({ return: true });
        }
      } else {
        return res.status(400).json({ return: false });
      }
    } else {
      return res.status(400).json({ return: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}


// Edit Betting Table Data
//router.post('/edit',
exports.EditManual = async (req, res) => {
  const { type, data } = req.body;
  const { sports_id, main_id, bookmark_id, market_id, name } = data;

  try {
    const bettingTable = await BettingTable.findById(sports_id);
    if (!bettingTable) {
      // Find the sports entry by sports_id
      return res.status(404).json({ return: false, message: 'Betting table not found' });
    }

    // Parse manual JSON if it's not empty
    if (bettingTable.manual && bettingTable.manual.length > 0) {
      let manual = JSON.parse(bettingTable.manual);

      switch (type) {
        case 'bookmark':
          if (manual[main_id]?.bookmakers[bookmark_id]) {
            manual[main_id].bookmakers[bookmark_id].title = name;
            bettingTable.manual = JSON.stringify(manual);
            await bettingTable.save();
            return res.json({ return: true });
          }
          break;

        case 'market':
          if (manual[main_id]?.bookmakers[bookmark_id]?.markets[market_id]) {
            manual[main_id].bookmakers[bookmark_id].markets[market_id].name = name;
            bettingTable.manual = JSON.stringify(manual);
            await bettingTable.save();
            return res.json({ return: true });
          }
          break;

        case 'market_price':
          if (manual[main_id]?.bookmakers[bookmark_id]?.markets[market_id]) {
            manual[main_id].bookmakers[bookmark_id].markets[market_id].price = name;
            bettingTable.manual = JSON.stringify(manual);
            await bettingTable.save();
            return res.json({ return: true });
          }
          break;

        default:
          return res.json({ return: false });
      }
    } else {
      return res.json({ return: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ return: false, message: 'Server Error' });
  }
}


// Function to get bet price
exports.BetPrice = async (req, res) => {
  try {
    const { sport_key, bet_type, bet_key, bet_name, sport_id } = req.body;

    if (!bet) {
      const bet = await BettingTable.findOne({ rel_id: sport_key });
      return res.status(404).json({ error: 'Bet not found' });
    }

    let price = null;

    if (bet_type === 'auto') {
      if (bet.history) {
        const history = JSON.parse(bet.history);
        if (history.output && history.output.data) {
          const data = history.output.data;
          for (const value of data) {
            if (value.bookmakers) {
              for (const bookmaker of value.bookmakers) {
                if (bookmaker.key === bet_key) {
                  for (const market of bookmaker.markets) {
                    for (const outcome of market.outcomes) {
                      if (outcome.name === bet_name) {
                        price = outcome.price;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else if (bet_type === 'manual') {
      if (bet.manual) {
        const manual = JSON.parse(bet.manual);
        for (const value of manual) {
          if (value.id === sport_id) {
            if (value.bookmakers) {
              for (const bookmaker of value.bookmakers) {
                for (const market of bookmaker.markets) {
                  if (market.name === bet_name) {
                    price = market.price;
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (price !== null) {
      return res.json({ price });
    } else {
      return res.status(404).json({ error: 'Price not found' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


//app.get('/api/withdraw',
exports.Users_withdraw = async (req, res) => {
  try {
    res.json(users);  // Send user data to frontend
  } catch (error) {
    const users = await User.find();
    res.status(500).send('Error fetching users');
  }
}






// Withdraw Accept
//router.post('/withdraw_accept', 
exports.withdraw_accept = async (req, res) => {
  const { id, trans_id } = req.body;

  try {
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
      const transaction = await WidthrowTableHistory.findById(id);
    }

    transaction.status = 1; // Accept
    if (trans_id) transaction.transactionID = trans_id;

    await transaction.save();

    res.json({ success: true, message: 'Update successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// Withdraw Reject
//router.post('/withdraw_reject', 

exports.withdraw_reject = async (req, res) => {
  const { id } = req.body;

  try {
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or already processed' });
      const transaction = await WidthrowTableHistory.findOne({ _id: id, status: 0 });
    }

    // Assuming you have a User model to handle user balances
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      const user = await User.findById(transaction.user_id);
    }

    user.balance += transaction.amount; // Revert balance
    await user.save();

    transaction.status = 2; // Reject
    await transaction.save();

    res.json({ success: true, message: 'Withdrawal rejected and balance restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}


// router.get("/sports-list",
// exports.Sports_list = async (req, res) => {
//   try {
//     const mode = req.query.mode || "In-Play";
//     const categoryId = req.query.category_id || 0;

//     let query = { id_active: true };
//     if (categoryId != 0) {
//       query._id = categoryId;
//     }

//     let responseData = [];

//     const categories = await SportsCategoryTable.find(query);
//     for (const category of categories) {
//       cetegory_id: category._id,
//         is_active: true,
//       const bettingRecords = await BettingTable.find({
//       });

//       let number = 0;
//       let categoryData = {
//         categoryName: category.name,
//         bets: [],
//       };

//       for (const record of bettingRecords) {
//         if (record.json) {
//           let jsonData = JSON.parse(record.json);
//           if (jsonData.odds && jsonData.odds.output) {
//             for (const bet of jsonData.odds.output) {
//               const commenceDate = new Date(bet.commence_time);
//               const today = new Date();
//               today.setHours(0, 0, 0, 0);
//               const tomorrow = new Date(today);
//               tomorrow.setDate(today.getDate() + 1);

//               if ((mode === "In-Play" && commenceDate <= new Date()) ||
//                 (mode === "Today" && commenceDate.toDateString() === today.toDateString()) ||
//                 (mode === "Tomorrow" && commenceDate.toDateString() === tomorrow.toDateString()) ||
//                 (mode === "all")) {
//                 number++;
//                 categoryData.bets.push({
//                   number,
//                   sportTitle: bet.sport_title,
//                   mode,
//                   commenceTime: bet.commence_time,
//                   awayTeam: bet.away_team,
//                   homeTeam: bet.home_team,
//                   betId: bet.id,
//                   sportKey: bet.sport_key,
//                   recordId: record._id,
//                 });
//               }
//             }
//           }
//         }
//       }
//       responseData.push(categoryData);
//     }
//     res.json(responseData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }



/*  exports.syncCasinoInfo = async(id)=> {




   const { id } = req.body;
   try {
    
     if (!provider) {
   const provider = await betproviderList.findOne({ is_active: true, _id: id });
       return { err: true, message: 'No provider found.' };
     }
 
     // Mark as syncing
     await betproviderList.updateOne({ _id: id }, { is_sync: true });
 
     // Make API call to fetch the game list
     const signature = Buffer.from(provider.opcode.toLowerCase() + provider.provider.toUpperCase() + provider.key).toString('hex').toUpperCase();
     const response = await axios.get('https://api.example.com/getGameList.ashx', {
       params: {
         operatorcode: provider.opcode,
         providercode: provider.provider,
         lang: 'en',
         html: 1,
         reformatjson: 'yes',
         signature,
       },
     });
 
     if (!response.data || response.data.errCode !== 0) {
       return { err: true, message: response.data ? 'Game list not found' : 'Failed to load API' };
     }
 
     const gameList = response.data.gamelist;
     let updateCount = 0;
 
     for (const item of gameList) {
       let categoryId = null;
       const gameCode = item.g_code;
       const categoryCode = item.p_type.toUpperCase();
 
       
       if (!category) {
       let category = await GameTypeTable.findOne({ type_code: categoryCode });
         category = new GameTypeTable({
           type_name: item.g_type,
           type_code: categoryCode,
           is_active: true,
         });
         await category.save();
         categoryId = category._id;
       }
 
       
       if (!game) {
       let game = await GameListTable.findOne({ game_id: gameCode, agent_id: provider._id });
         const imageUrl = await uploadImageToImageBB(item.imgFileName);
         const newGame = new GameListTable({
           game_name: item.gameName.gameName_enus.toUpperCase(),
           game_Id: gameCode,
           game_type: categoryCode,
           agent_Id: provider._id,
           category_id: categoryId,
           image_url: imageUrl,
           is_active: true,
         });
         await newGame.save();
         updateCount++;
       } else if (!game.image_url) {
         const imageUrl = await uploadImageToImageBB(item.imgFileName);
         game.image_url = imageUrl;
         await game.save();
       }
     }
 
     // Update provider sync status
     await BetProviderTable.updateOne({ _id: id }, { is_sync: false });
 
     return { err: false, message: updateCount > 0 ? `${updateCount} games added.` : 'No new games to add.' };
   } catch (err) {
     return { err: true, message: 'Error syncing casino info: ' + err.message };
   }
 } */













   
   const fetchBalance = async (agent, username) => {
       try {
           const signature = crypto.createHash('md5').update(
               `${agent.operatorcode.toLowerCase()}${agent.auth_pass}${agent.providercode.toUpperCase()}${username}${agent.key}`
           ).digest('hex').toUpperCase();
   
           console.log("Generated Signature:", signature);
   
           const params = {
               operatorcode: agent.operatorcode,
               providercode: agent.providercode,
               username: username,
               password: agent.auth_pass,
               signature
           };
   
           const apiUrl = `http://fetch.336699bet.com/getBalance.aspx`;
   
           const response = await axios.get(apiUrl, { params, headers: { 'Content-Type': 'application/json' }, responseType: 'json' });
   
           let parsedData = response.data;
           
   
           return parseFloat(parsedData.balance);
       } catch (error) {
           console.log("Error fetching balance:", error.message);
           return null;
       }
   };
   
   function randomStr() {
       return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
   }
   
  const refreshBalancebefore = async (userId, game_id) => {

       
 
           if (!userId) return res.status(400).json({ errCode: 2, errMsg: 'Please Login' });
   
           const user = await User.findOne({ userId: userId });
           if (!user) return res.status(404).json({ errCode: 2, errMsg: 'User not found' });
   
           let balance = user.balance;
           const game = await gameTable.findOne({ userId: user.userId, gameId: user.last_game_id, game_id: game_id });
          //  console.log("game", game);
   
           if (!game) return  balance 
   
           const agent = await BetProviderTable.findOne({ providercode: game.agentId });
          //  console.log("agent", agent);
           if (!agent) return res.status(500).json({ errCode: 2, errMsg: 'Server error, try again.', balance });
   
           const username = user.userId;
           let amount = null;
   
           if (balance === 0) {
               amount = await fetchBalance(agent, username);
               if (amount === null) {
                   return res.json({ errCode: 0, errMsg: 'Success', balance });
               }
           } else {
               return  balance 
           }
   
           console.log("Fetched Balance:", amount);
           setTimeout(async () => {
           if (amount > 0) {
               balance += amount;
   
               await User.findOneAndUpdate(
                   { userId: userId },
                   { $set: { balance: parseFloat(balance) } },
                   { new: true }
               );
   
               console.log("Updated Balance:", balance);
              console.log("Updated Balance:", balance);
           }
           
           const transId = `${randomStr(3)}${randomStr(3)}${randomStr(3)}`.substring(0, 8).toUpperCase();
           const signature = crypto.createHash('md5').update(
               `${amount}${agent.operatorcode.toLowerCase()}${agent.auth_pass}${agent.providercode.toUpperCase()}${transId}1${user.userId}${agent.key}`
           ).digest('hex').toUpperCase();
   
           console.log("Transaction ID:", transId);
           console.log("Signature:", signature);
   
           const params = {
               operatorcode: agent.operatorcode,
               providercode: agent.providercode,
               username: user.userId,
               password: agent.auth_pass,
               referenceid: transId,
               type: 1,
               amount: amount,
               signature
           };
   
           try {
               const refund = await axios.get('http://fetch.336699bet.com/makeTransfer.aspx', { params });
               console.log("Refund Response:", refund.data);
               console.log("Updated Balance:", balance);
               if (refund.errMsg === "NOT_ALLOW_TO_MAKE_TRANSFER_WHILE_IN_GAME") {
                   return res.json({ errCode: 0, errMsg: "Transaction not allowed while in game. Try again later.", balance });
               }
   
               if (refund.innerCode === null) {
                   return res.status(500).json({ errCode: 2, errMsg: 'Server transaction error, try again.', balance });
               }
           } catch (transferError) {
               console.log("Transfer API Error:", transferError.message);
               return res.status(500).json({ errCode: 2, errMsg: 'Transfer API Error', balance });
           }
       }, 5000);
           const win = amount - game.betAmount;
           console.log("Win Amount:", win);
   
            if (!isNaN(win) && win !== 0) {
                await gameTable.updateOne(
                    { gameId: game.gameId },
                    { $set: { winAmount: win, returnId: transId, status: win < 0 ? 2 : 1 } },
                    { upsert: true }
                );
            }
           const updatedUser = await User.findOne({ userId: userId });
           return  updatedUser.balance 
   
      
   };











   





// Launch game API
// router.post("/launch_game",
const fetchApi = async (endpoint, data = {}) => {
  try {
    const baseURL = "http://fetch.336699bet.com/"; // Replace with actual API base URL
    const url = `${baseURL}${endpoint}`;

    const config = {
      method: "GET", // Default: POST
      url,
      timeout: 10000, // 10 seconds timeout
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",

      },
    };

    if (config.method === "POST") {
      config.data = data;
    } else {
      config.params = data;
    }

    const response = await axios(config);

    
    return response.data
    // 
  } catch (error) {
    console.error("API Request Failed:", error.message);
    return { errCode: 3, errMsg: "Network or API Error" };
  }
};









exports.launchGame = async (req, res) => {
  
  console.log(
    "req.body",
    req.body
  )
  try {
    // Check if user is logged in
    
   const { userId, game_id, is_demo, newProvider } = req.body;
console.log("userId",userId,game_id)
    if (!userId) {
    
      return res.status(400).json({ errCode: 1, errMsg: "User not found." });
    }
    const user = await User.findOne({ userId });

    let amount = user.balance;
    const last_game_id = user.last_game_id;
    console.log("amount", amount)
    // Refresh balance if last game exists

    const agent = await GameListTable.aggregate([
      {
        $match: { g_code: game_id, }
      },
      {
        $lookup: {
          from: "betprovidertables",
          localField: "p_code",
          foreignField: "providercode",
          as: "provider"
        }
      },
      { $unwind: "$provider" },
      {
        $project: {
          // id: "$provider._id",
          providercode: "$provider.providercode",
          operatorcode: "$provider.operatorcode",
          key: "$provider.key",
          auth_pass: "$provider.auth_pass",
          game_type: "$p_type"
        }
      }
    ]);




    console.log("agent", agent)
    
    if (last_game_id) {

     
      const resBalance = await refreshBalancebefore (user.userId,agent);
      console.log("resBalance", resBalance)
      // if (!resBalance || resBalance.errCode !== 0) {
      //   return res.json(resBalance);
      // }
      // amount += resBalance.balance || 0;

      // console.log("amount-3", amount)
    }
    
    // Insufficient balance check
    if (amount < 1) {
      return res.json({ errCode: 2, errMsg: "Insufficient balance." });
    }

    // Fetch game and provider details using aggregation
    

    

    if (!agent || agent.length === 0) {
      return res.json({ errCode: 1, errMsg: "Agent not found." });
    }

    const provider = agent[0]
    

    console.log("provider", provider);
    let game_url;


    const signature = generateSignature(
      provider.operatorcode,
      provider.auth_pass,
      provider.providercode,
      provider.game_type,
      user.userId,
      provider.key

    )
    const field = {
      operatorcode: provider.operatorcode,
      providercode: provider.providercode,
      username: user.userId,
      password: provider.auth_pass,
      type: provider.game_type,
      gameid: game_id,
      lang: "en-US",
      html5: 1,
      signature: signature
    };

    // console.log("field - All", field);



    if (!is_demo) {
      // Generate transaction ID
      const transId = `${randomStr(6)}${randomStr(6)}${randomStr(6)}`.substring(0, 10);


      const signature = generateSignature(
        amount.toString(),
        provider.operatorcode,
        provider.auth_pass,
        provider.providercode,
        transId,
        0,
        user.userId,
        provider.key

      )
      console.log("signature", signature);
      // Make transfer API call
      const transferResponse = await fetchApi("makeTransfer.aspx", {
        operatorcode: provider.operatorcode,
        providercode: provider.providercode,
        username: user.userId,
        password: provider.auth_pass,
        referenceid: transId,
        type: 0,
        amount: amount,
        signature: signature
      });


      
      console.log("transferResponse", transferResponse);

      // if (!transferResponse || transferResponse.errCode !== "0") {

      //   return res.json({ errCode: 2, errMsg: "Failed to load balance." });
      // }

      // Insert game transaction
      await gameTable.create({
        userId: user.userId,
        agentId: provider.providercode,
        gameId: game_id,
        currencyId: user.currencyId,
        betAmount: amount,
        transactionId: transId
      });

      // Update user balance
      await User.updateOne(
        { userId: user.userId },
        { balance: 0, last_game_id: game_id }
      );

      const signatureLunchGame = generateSignature(
        provider.operatorcode,
        provider.auth_pass,
        provider.providercode,
        provider.game_type,
        user.userId,
        provider.key

      )
      const field = {
        operatorcode: provider.operatorcode,
        providercode: provider.providercode,
        username: user.userId,
        password: provider.auth_pass,
        type: provider.game_type,
        gameid: game_id,
        lang: "en-US",
        html5: 1,
        signature: signatureLunchGame
      };
      console.log("field:", field);



      game_url = await fetchApi("launchGames.aspx", field);
      console.log("game_url:", game_url);
    } else {
      game_url = await fetchApi("launchDGames.ashx", field);
      console.log(game_url)
    }

    return res.json(game_url || { errCode: 2, errMsg: "Failed to load API." });
  } catch (error) {
    console.error("Launch Game Error:", error);
    console.log("Launch Game Error:", error);
    res.status(500).json({ errCode: 500, errMsg: "Server error." });
  }
}

// Generate a random string for transaction ID
function randomStr() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate API signature
function generateSignature(...args) {
  console.log("args:", args);
  return crypto.createHash("md5").update(args.join("")).digest("hex").toUpperCase();
}





// Generate a random string for transaction ID
function randomStr() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate API signature
function generateSignature(...args) {
  console.log("args:", args);
  return crypto.createHash("md5").update(args.join("")).digest("hex").toUpperCase();
}


// Generate a random string for transaction ID
function randomStr() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate API signature
function generateSignature(...args) {
  console.log("args:", args);
  return crypto.createHash("md5").update(args.join("")).digest("hex").toUpperCase();
}












// // Generate a random string for transaction ID
// function randomStr() {
//   return Math.random().toString(36).substring(2, 10).toUpperCase();
// }

// // Generate API signature
// function generateSignature(...args) {
//   console.log("args:", args);
//   return crypto.createHash("md5").update(args.join("")).digest("hex").toUpperCase();
// }













// app.get('/betting', async (req, res) => {
//   try {
//     res.json(sports);
//   } catch (err) {
//     const sports = await Betting.find({ is_active: true, rel_type: 'odds' });
//     res.status(500).json({ message: 'Error fetching betting data' });
//   }
// });




// app.get('/corn', async (req, res) => {
//   try {

//     for (const sport of sports) {
//     const sports = await Betting.find({ is_active: true, rel_type: 'odds' });
//       await updateJson(sport.rel_id, sport._id);
//     }

//     res.json(sports);
//   } catch (err) {
//     res.status(500).json({ message: 'Error syncing corn data' });
//   }
// });





// async function updateJson(key, id) {
//   try {
//     const odds = await oddsSports(key);
//     const allEvent = [];

//     if (odds.return) {
//       for (const o of odds.output) {
//         const event = await oddsEvent(o.sport_key, o.id);
//         if (event.return) {
//           allEvent.push(event);
//         }
//       }
//     }

//     const score = await oddsScores(key);
//     let history = [];
//     if (odds.return && odds.output.length > 0) {
//       history = await oddsHistorical(key, odds.output[0].commence_time);
//     }

//       history: JSON.stringify(history),
//       json: JSON.stringify({ odds, event: allEvent, score, history })
//     await Betting.findByIdAndUpdate(id, {
//     });

//   } catch (err) {
//     console.error('Error updating JSON:', err);
//   }
// }



// async function oddsSports(key) {
//   try {
//     const apiKey = 'your-api-key'; // Fetch from environment or config
//     const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/odds`, {
//       params: {
//         apiKey,
//         regions: 'us', // Use appropriate region
//         markets: 'h2h,spreads',
//         oddsFormat: 'decimal'
//       }
//     });
//     return { return: true, message: 'b_sync_done', output: response.data };
//   } catch (err) {
//     return { return: false, message: err.message, output: [] };
//   }
// }

// async function oddsEvent(key, id) {
//   try {
//     const apiKey = 'your-api-key'; // Fetch from environment or config
//     const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/events/${id}/odds`, {
//       params: {
//         apiKey,
//         regions: 'us',
//         markets: 'h2h,spreads',
//         oddsFormat: 'decimal'
//       }
//     });
//     return { return: true, message: 'b_sync_done', output: response.data };
//   } catch (err) {
//     return { return: false, message: err.message, output: [] };
//   }
// }

// async function oddsScores(key) {
//   try {
//     const apiKey = 'your-api-key'; // Fetch from environment or config
//     const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/scores`, {
//       params: {
//         apiKey,
//         daysFrom: 1
//       }
//     });
//     return { return: true, message: 'b_sync_done', output: response.data };
//   } catch (err) {
//     return { return: false, message: err.message, output: [] };
//   }
// }

// async function oddsHistorical(key, time) {
//   try {
//     const apiKey = 'your-api-key'; // Fetch from environment or config
//     const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/odds-history`, {
//       params: {
//         apiKey,
//         regions: 'us',
//         markets: 'h2h',
//         oddsFormat: 'decimal',
//         date: time
//       }
//     });
//     return { return: true, message: 'b_sync_done', output: response.data };
//   } catch (err) {
//     return { return: false, message: err.message, output: [] };
//   }
// }







// app.post('/bet_sync', async (req, res) => {
//   try {
//     const { id } = req.body;

//     if (sport) {
//     const sport = await Betting.findOne({ _id: id });
//       await updateJson(sport.rel_id, sport._id);
//       res.json({ return: true, message: 'b_sync_done' });
//     } else {
//       res.status(404).json({ return: false, message: 'Betting data not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ return: false, message: 'Error syncing bet data' });
//   }
// });





// app.post('/delete', async (req, res) => {
//   try {
//     const { type, sports_id, main_id, bookmark_id, market_id } = req.body;

//     if (sport && sport.manual) {
//     const sport = await Betting.findOne({ _id: sports_id });
//       let manual = JSON.parse(sport.manual);

//       if (type === 'bookmark') {
//         manual[main_id].bookmakers.splice(bookmark_id, 1);
//       } else if (type === 'market') {
//         manual[main_id].bookmakers[bookmark_id].markets.splice(market_id, 1);
//       }

//       sport.manual = JSON.stringify(manual);
//       await sport.save();
//       res.json({ return: true });
//     } else {
//       res.status(404).json({ return: false, message: 'No betting data found or manual data is empty' });
//     }
//   } catch (err) {
//     res.status(500).json({ return: false, message: 'Error deleting data' });
//   }
// });






// app.post('/edit', async (req, res) => {
//   try {
//     const { type, sports_id, main_id, bookmark_id, market_id, name } = req.body;

//     if (sport && sport.manual) {
//     const sport = await Betting.findOne({ _id: sports_id });
//       let manual = JSON.parse(sport.manual);

//       if (type === 'bookmark') {
//         manual[main_id].bookmakers[bookmark_id].title = name;
//       } else if (type === 'market') {
//         manual[main_id].bookmakers[bookmark_id].markets[market_id].name = name;
//       } else if (type === 'market_price') {
//         manual[main_id].bookmakers[bookmark_id].markets[market_id].price = name;
//       }

//       sport.manual = JSON.stringify(manual);
//       await sport.save();
//       res.json({ return: true });
//     } else {
//       res.status(404).json({ return: false, message: 'No betting data found or manual data is empty' });
//     }
//   } catch (err) {
//     res.status(500).json({ return: false, message: 'Error editing data' });
//   }
// });













// router.get('/user-history/:id',
exports.UserHistory = async (req, res) => {
  try {
    const userId = req.body.userId;

    const history = await gameTable.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $lookup: {
          from: 'users', // Collection name in MongoDB
          localField: 'userId',
          foreignField: 'userId',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'gamelisttables',
          localField: 'gameId',
          foreignField: '_id',
          as: 'game'
        }
      },
      {
        $lookup: {
          from: 'currencies',
          localField: 'currencyId',
          foreignField: '_id',
          as: 'currency'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$game', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$currency', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          name: '$user.name',
          game: '$game.gameName.gameName_enus',
          currency: '$currency.name',
          bet: '$betAmount',
          win: '$winAmount',
          status: 1,
          create_date: '$timestamp'
        }
      },
      { $limit: 100 }
    ]);

    res.status(200).json({ userId, title: 'User History', history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

















exports.getCategoriesWithProviders = async (req, res) => {
  try {
    // const { provider, category, game } = req.body
    const { provider, category, game } = req.query;
    // Fetch all categories
    const categories = await Category.find({ category_name: category });


    // Fetch games for each category along with their providers
    const categoriesWithGamesAndProviders = await Promise.all(
      categories.map(async (category) => {
        // Fetch games for each category
        const games = await GameListTable.aggregate([
          { $match: { category_name: category.category_name } },
          {
            $lookup: {
              from: "betprovidertables",
              localField: "p_code",
              foreignField: "providercode",
              as: "providers"
            }
          },
          {
            $project: {
              name: 1,
              "providers.providercode": 1
            }
          }
        ]);

        const providerSet = new Set();
        games.forEach(game => {
          game.providers.forEach(provider => providerSet.add(provider.providercode));
        });

        const uniqueProviders = await BetProviderTable.find(
          { providercode: { $in: Array.from(providerSet) } },
          { company: 1, providercode: 1, url: 1, image_url: 1, _id: 0 }
        );

        // Format the result
        return {

          uniqueProviders


        };
      })
    );

    res.json(categoriesWithGamesAndProviders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


exports.getCategoriesWithProvidersGameList = async (req, res) => {
  try {
    // const { provider, category } = req.body
    const { provider, category } = req.query;
    // Fetch all categories
    if (!provider || !category) {
      return res.status(404).json({ message: 'Provider and Category not found' });
    }
    const game = await GameListTable.find({ p_code: provider, category_name: category }).sort({ serial_number: -1 });;
    console.log(game)

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}




// exports.getGamesAndProviders = async (req, res) => {
//   try {
//     // Fetch all categories
//     const categories = await Category.find();

//     // Fetch games for each category and their providers
//     const categoriesWithGamesAndProviders = await Promise.all(
//       categories.map(async (category) => {
//         // Fetch games and provider details in a single query
//         const gamesWithProviders = await GameListTable.aggregate([
//           { $match: { category_name: category.category_name } },
//           {
//             $lookup: {
//               from: "betprovidertables",
//               localField: "p_code",
//               foreignField: "providercode",
//               as: "providers"
//             }
//           },
//           {
//             $project: {
//               name: 1,
//               p_code: 1,
//               providers: { providercode: 1, company: 1, url: 1, image_url: 1 }
//             }
//           }
//         ]);

//         // Extract unique providers
//         const providerMap = new Map();
//         gamesWithProviders.forEach(game => {
//           game.providers.forEach(provider => {
//             if (!providerMap.has(provider.providercode)) {
//               providerMap.set(provider.providercode, provider);
//             }
//           });
//         });

//         return {
//           category: {
//             name: category.category_name,
//             image: category.image,
//             id_active: category.id_active, // Indicates if the category is active
//           },
//            uniqueProviders: Array.from(providerMap.values()), // Unique providers
//            games: gamesWithProviders.map(({ name, p_code }) => ({  })) // Return games if needed
//         };
//       })
//     );

//     res.json(categoriesWithGamesAndProviders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }




///////
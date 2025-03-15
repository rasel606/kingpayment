const BetProviderTable = require('../Models/BetProviderTable')
const GameTypeTable = require('../Models/GameTypeTable')
const GameListTable = require('../Models/GameListTable');
const BetHistoryTable = require('../Models/BetHistoryTable'); // Import the model
const BettingTable = require('../Models/BettingTable');



exports.DeleteGameType = async (req, res) => {
    try {
        const { id } = req.params;
        const gameType = await GameTypeTable.findById(id);

        if (!gameType) {
            return res.status(404).json({ error: 'Game type not found' });
        }

        if (gameType.type_image && fs.existsSync(gameType.type_image)) {
            fs.unlinkSync(gameType.type_image);
        }

        await GameTypeTable.findByIdAndDelete(id);
        res.status(200).json({ message: 'Game type deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


  exports.syncCasinoInfo = async (req, res) => {
    const { id } = req.params;

    let message = 'Your system is already up-to-date.';
    let updatedGames = 0;

    try {
        // Check if a sync process is already ongoing
        const activeProviderCount = await BetProviderTable.countDocuments({ is_sync: true });

        if (activeProviderCount > 0) {
            return res.status(400).json({
                error: true,
                message: 'Already a process working...'
            });
        }

        // Fetch the provider by ID
        const agent = await BetProviderTable.findOne({ is_active: true, _id: id });

        if (!agent) {
            return res.status(404).json({
                error: true,
                message: 'No providers found...'
            });
        }

        // Mark provider as syncing
        await BetProviderTable.updateOne({ _id: id }, { is_sync: true });

        // Call the external API
        const signature = `${agent.opcode.toLowerCase()}${agent.provider.toUpperCase()}${agent.key}`;
        const apiResponse = await axios.post('https://api.example.com/getGameList.ashx', {
            operatorcode: agent.opcode,
            providercode: agent.provider,
            lang: 'en',
            html: 1,
            reformatjson: 'yes',
            signature: signature.toUpperCase()
        });

        const { data } = apiResponse;
        if (!data || data.errCode !== 0) {
            return res.status(400).json({
                error: true,
                message: data ? 'Game list not found' : 'Failed to load API'
            });
        }

        const gameListData = JSON.parse(data.gamelist);

        for (const item of gameListData) {
            let categoryId = null;
            const gameCode = item.g_code;
            const categoryCode = item.p_type.toUpperCase();

            // Check or create game type
            let category = await GameListTable.findOne({ type_code: categoryCode });

            if (!category) {
                category = await GameListTable.create({
                    type_name: item.g_type.charAt(0).toUpperCase() + item.g_type.slice(1).toLowerCase(),
                    type_code: categoryCode,
                    is_active: true
                });

                categoryId = category._id;
            } else {
                categoryId = category._id;
            }

            // Check if the game already exists
            let existingGame = await GameListTable.findOne({
                game_Id: gameCode,
                agent_Id: agent._id
            });

            if (!existingGame) {
                // Upload image and insert game
                const uploadedImageUrl = await fetchImage(item.imgFileName, 'modules/betting/upload/game-list/');

                await GameListTable.create({
                    game_name: item.gameName.gameName_enus.toUpperCase(),
                    game_Id: gameCode,
                    game_type: categoryCode,
                    agent_Id: agent._id,
                    category_id: categoryId,
                    image_url: uploadedImageUrl
                });

                updatedGames++;
            } else if (!existingGame.image_url) {
                // Update image URL if missing
                const uploadedImageUrl = await fetchImage(item.imgFileName, 'modules/betting/upload/game-list/');

                await GameListTable.updateOne({ _id: existingGame._id }, {
                    image_url: uploadedImageUrl
                });
            }
        }

        if (updatedGames > 0) {
            message = `Total ${updatedGames} games added.`;
        }

        // Reset sync status
        await BetProviderTable.updateOne({ _id: id }, { is_sync: false });

        res.status(200).json({
            error: false,
            message
        });
    } catch (error) {
        console.error(error);
    }
}





async function uploadImage(imagePath) {
    try {
        const formData = new FormData();
        formData.append('image', imagePath);
        
        const response = await axios.post('https://api.imgbb.com/1/upload?key=' + imagebbApiKey, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data.data.url;  // return the image URL from ImageBB
    } catch (error) {
        throw new Error('Image upload failed');
    }
}

exports.saveOrUpdateGameCategory = async (req, res)=> {
    const { category_id, category_name, category_code, order_by } = req.body;
    const { type_image } = req.files;  // assuming you're using 'express-fileupload' middleware

    const data = {
        type_name: category_name,
        type_code: category_code,
        order_by: order_by,
    };

    try {
        // Handle file upload if provided
        if (type_image) {
            const imageUrl = await uploadImage(type_image.tempFilePath);  // Upload image to ImageBB
            data.type_image = imageUrl;
        }

        if (category_id === 0) {
            const newCategory = new GameTypeList(data);
            await newCategory.save();
            return res.json({ message: 'Category saved successfully!' });
        } else {
            await GameTypeList.findByIdAndUpdate(category_id, data, { new: true });
            return res.json({ message: 'Category updated successfully!' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error processing your request.' });
    }
}


const uploadToImageBB = async (fileBuffer) => {
    const formData = new FormData();
    formData.append('image', fileBuffer);
    
  
    try {
      const response = await axios.post('https://api.imgbb.com/1/upload?key=YOUR_IMAGEBB_API_KEY', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.url; // Returning the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading to ImageBB:', error);
      return null;
    }
  };
  
  exports.casino_update = async  (req, res) => {
    const data = {
        
            type_name: category_name,
            type_code: category_code,
            order_by: order_by,
        
    };
    const files = req.files;
    const imagePaths = {};
  
    try {
      if (files) {
        for (let key in files) {
          const file = files[key][0];
          const imageUrl = await uploadToImageBB(file.buffer);
  
          if (imageUrl) {
            imagePaths[key] = imageUrl;
          }
        }
      }
  
      // Update database with new data
      const updatedCasino = await GameTypeList.findOneAndUpdate(
        { _id: req.params.id },
        { ...data, ...imagePaths, updatetimestamp: new Date() },
        { new: true }
      );
  
      if (updatedCasino) {
        return res.status(200).json(updatedCasino);
      } else {
        return res.status(404).json({ message: 'Casino not found' });
      }
    } catch (error) {
      console.error('Error updating casino:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };




exports.getCasinoCategories = async (req, res) => {
    try {
      const categories = await CasinoCategory.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

 



// Get details of a specific bet and related bets
exports.getUserBet = async (req, res) => {
    try {
      const { id } = req.params;
  
      const bet = await Bet.findOne({ bet_id: id });
      if (!bet) return res.status(404).json({ message: 'Bet not found' });
  
      const relatedBets = await Bet.find({ sport_key: bet.sport_key, bet_win: 0 }).select('bet_name').distinct('bet_name');
      const relatedBetCount = await Bet.countDocuments({ sport_key: bet.sport_key, bet_win: 0 });
  
      res.json({ bet, names: relatedBets, count: relatedBetCount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Get bet history
exports.getBetHistory = async (req, res) => {
    try {
      const { id } = req.params;
  
      const bet = await Bet.findOne({ bet_id: id });
      if (!bet) return res.status(404).json({ message: 'Bet history not found' });
  
      res.json(bet);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Update a bet's win/loss status
exports.updateBet = async (req, res) => {
    try {
      const { win, name } = req.body;
      const winStatus = win === 'true' ? 1 : 2;
  
      await BettingTable.updateMany({ bet_name: name }, { $set: { bet_win: winStatus } });
      res.json({ success: true, message: 'Bet updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  

  /// update json

  // Function to update json for the betting record
const updateJson = async (relId, bettingId) => {
    // Implement your update logic here
    // You can update the 'json' field or any other relevant operation
    const bettingRecord = await BettingTable.findOne({ rel_id: relId });
    if (bettingRecord) {
        bettingRecord.json = JSON.stringify({ updated: true, bettingId: bettingId });
        await bettingRecord.save();
    }
};

// Endpoint to replace the corn function
exports.BettingUpdate = async (req, res) => {
    try {
        // Fetch records from BettingTable with 'is_active' and 'rel_type'
        const sports = await BettingTable.find({ is_active: true, rel_type: 'odds' });

        // Loop through the results and call updateJson function
        for (const sport of sports) {
            await updateJson(sport.rel_id, sport._id);
        }

        res.status(200).send(sports);
    } catch (err) {
        console.error('Error updating betting:', err);
        res.status(500).send({ error: 'Something went wrong!' });
    }
}











// const Betting = require('./models/Betting');  // Assuming a Mongoose model for Betting

// async function addManualBetting(data) {
//   try {
//     const betting = await Betting.findOne({ _id: data.id });

//     if (betting) {
//       let manualData = betting.manual ? JSON.parse(betting.manual) : [];

//       const index = manualData.findIndex(item => item.id === data.sports_id);
//       if (index !== -1) {
//         let bookmakerIndex = manualData[index].bookmakers.findIndex(b => b.title === data.title);

//         if (bookmakerIndex === -1) {
//           manualData[index].bookmakers.push({
//             title: data.title,
//             markets: [{ name: data.name, price: data.price }]
//           });
//         } else {
//           manualData[index].bookmakers[bookmakerIndex].markets.push({
//             name: data.name,
//             price: data.price
//           });
//         }
//       } else {
//         manualData.push({
//           id: data.sports_id,
//           sport_key: data.sports_key,
//           bookmakers: [{
//             title: data.title,
//             markets: [{ name: data.name, price: data.price }]
//           }]
//         });
//       }

//       // Update the betting document with the new manual data
//       await Betting.findOneAndUpdate({ _id: data.id }, { manual: JSON.stringify(manualData) });

//       return { return: true, message: 'Sync completed' };
//     } else {
//       return { return: false, message: 'Server problem' };
//     }
//   } catch (error) {
//     console.error(error);
//     return { return: false, message: 'Error occurred during sync' };
//   }
// }

 












  
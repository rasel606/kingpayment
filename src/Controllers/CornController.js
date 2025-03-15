const BettingTable = require("../Models/BettingTable");
const ModelBettingController = require("./ModelBettingController");

/* const SportsCategoryTable = require("../Models/SportsCategoryTable") */




//app.get('/betting',
exports.Betting = async (req, res) => {
    try {
      const sports = await BettingTable.find({ is_active: true, rel_type: 'odds' });
      res.json(sports);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  }



    // Function to update json for each sport
    async function corn() {
      try {
        const sports = await BettingTable.find({ is_active: true, rel_type: 'odds' });
    
        for (const sport of sports) {
          const key = sport.rel_id;
          await updateJson(key, sport._id);
        }
    
        return sports;
      } catch (error) {
        console.error("Error fetching or updating sports:", error);
      }
    }





    // Express route to handle the update
const updateJson= async (req, res) => {
  const { key, id } = req.body;  // Assuming key and id are passed in the request body
  
  try {
      // Fetch odds data
      const odds = await Odd_Sports(key);
      const allEvent = [];

      if (odds.return) {
          for (const o of odds.output) {
              const event = await oddsEvent(o.sport_key, o.id);
              if (event.return) {
                  allEvent.push(event);
              }
          }
      }

      // Fetch scores data
      const score = await Odds_Score(key);

      // Fetch historical data
      let history = [];
      if (odds.return && odds.output.length > 0) {
          history = await oddsHistorical(key, odds.output[0].commence_time);
      }

      // Update the document in MongoDB
      await BettingTable.updateOne(
          { _id: id },
          {
              $set: {
                  history: history,
                  json: JSON.stringify({ odds, event: allEvent, score, history }),
                  updatetimestamp: new Date(),
              },
          }
      );

      res.status(200).send({ message: 'Updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Error updating data' });
  }
}
      

// Helper functions to mimic the logic in PHP (replace with your actual APIs)
// async function oddsSports(key) {
//     // Fetch data from API (replace with actual URL)
//     const response = await axios.get(`https://api.example.com/odds/${key}`);
//     return response.data;
// }

// async function oddsEvent(sportKey, id) {
//     // Fetch data for a specific event (replace with actual URL)
//     const response = await axios.get(`https://api.example.com/event/${sportKey}/${id}`);
//     return response.data;
// }

// async function oddsScores(key) {
//     // Fetch scores data (replace with actual URL)
//     const response = await axios.get(`https://api.example.com/scores/${key}`);
//     return response.data;
// }

// async function oddsHistorical(key, commenceTime) {
//     // Fetch historical odds (replace with actual URL)
//     const response = await axios.get(`https://api.example.com/historical/${key}/${commenceTime}`);
//     return response.data;
// }





// Define the odds_sports route
const Odd_Sports=  async (req, res) => {
    const { key } = req.params;
    const apiKey = 'YOUR_API_KEY'; // Replace with your API key
    const regions = 'us'; // Replace with appropriate regions
    const oddsFormat = 'decimal'; // Replace with your odds format
  
    try {
      const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/odds`, {
        params: {
          apiKey,
          regions,
          markets: 'h2h,spreads',
          oddsFormat,
        },
      });
  
      const output = response.data;
  
      if (output.message) {
        return res.json({ return: false, message: output.message, output: [] });
      }
  
      // Insert the data into MongoDB
      const newBettingRecord = new BettingTable({
        rel_id: key, // replace with actual data
        rel_type: 'some-rel-type', // replace with actual data
        staff_id: 'some-staff-id', // replace with actual data
        cetegory_id: 'some-category-id', // replace with actual data
        json: JSON.stringify(output),
      });
  
      await newBettingRecord.save();
  
      return res.json({
        return: true,
        message: 'Sync done',
        output,
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        return: false,
        message: 'An error occurred while fetching data',
        output: [],
      });
    }
  }


  // Step 3: Create a route to handle fetching odds
exports.OddEvents= async (req, res) => {
    const { key, id } = req.body;
  
    const apikey = process.env.BETTING_ODDS_API_KEY; // You should store your API key securely
    const regions = process.env.BETTING_ODDS_REGION;
    const oddsFormat = process.env.BETTING_ODDS_ODDSFORMAT;
  
    const url = `https://api.the-odds-api.com/v4/sports/${key}/events/${id}/odds?apiKey=${apikey}&regions=${regions}&markets=h2h,spreads&oddsFormat=${oddsFormat}`;
  
    try {
      const response = await axios.get(url);
      const output = response.data;
  
      if (output.message) {
        return res.json({ return: false, message: output.message, output: [] });
      } else {
        // Save data to MongoDB
        // const bettingData = new BettingTable({
        //   rel_id: key, // or another relevant field
        //   rel_type: 'odds', // or another type
        //   staff_id: 'staff_id_example', // replace with real staff ID
        //   cetegory_id: 'category_id_example', // replace with category ID
        //   json: JSON.stringify(output), // Store the response as JSON
        //   is_active: true,
        //   history: 1, // example field
        // });
  
        // await bettingData.save();
  
        return res.json({ return: true, message: 'Synchronization done', output });
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
      return res.status(500).json({ return: false, message: 'Internal Server Error', output: [] });
    }
  }
  
  

  // Replace this with your actual API key
const apiKey = process.env.BETTING_ODDS_API_KEY;

//router.get('/odds-scores/:key'


const Odds_Score = async (req, res) => {
  const { key } = req.params;

  try {
    // Make API request to get odds scores
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${key}/scores/`, {
      params: {
        daysFrom: 1,
        apiKey: apiKey,
      }
    });

    // Handle API response
    const output = response.data;

    if (output.message) {
      return res.json({
        return: false,
        message: output.message,
        output: []
      });
    } else {
      // You can now save the betting table data to MongoDB if needed
      // const bettingTable = new BettingTable({
      //   rel_id: 'example_id',
      //   rel_type: 'example_type',
      //   staff_id: 'staff_123',
      //   cetegory_id: 'category_1',
      //   json: JSON.stringify(output), // Save the response JSON as a string
      //   is_active: true,
      //   history: 0,
      //   manual: 0,
      // });

      // await bettingTable.save();

      return res.json({
        return: true,
        message: 'Sync done',
        output: output
      });
    }
  } catch (error) {
    return res.status(500).json({
      return: false,
      message: 'Error occurred while fetching data',
      output: []
    });
  }
}




// Express route to handle the odds history request
exports.OddHistory= async (req, res) => {
    const { key, time } = req.query;
    
    if (!key || !time) {
      return res.status(400).json({
        return: false,
        message: 'Key and time are required parameters.',
        output: [],
      });
    }
  
    try {
      const apiKey = process.env.BETTING_ODDS_API_KEY; // Fetch your API key from environment variable or a config file
      const regions = process.env.BETTING_ODDS_REGION || 'us'; // default region if not set
      const oddsFormat = process.env.BETTING_ODDS_FORMAT || 'decimal'; // default odds format if not set
  
      const url = `https://api.the-odds-api.com/v4/sports/${key}/odds-history/?apiKey=${apiKey}&regions=${regions}&markets=h2h&oddsFormat=${oddsFormat}&date=${time}`;
      
      const response = await axios.get(url);
      const output = response.data;
  
      if (output.message) {
        return res.json({
          return: false,
          message: output.message,
          output: [],
        });
      }
  
      // Store the historical odds in MongoDB if needed (optional)
      // const bettingRecord = new BettingTable({
      //   rel_id: key,
      //   rel_type: 'odds-history',
      //   staff_id: 'admin',  // Example value, change based on actual context
      //   cetegory_id: 'odds',  // Example value
      //   json: JSON.stringify(output),  // Saving response as a JSON string
      // });
      
      // await bettingRecord.save();
  
      return res.json({
        return: true,
        message: 'Sync completed successfully.',
        output: output,
      });
      
    } catch (error) {
      console.error('Error fetching odds history:', error);
      return res.status(500).json({
        return: false,
        message: 'Error fetching odds history.',
        output: [],
      });
    }
  }


 exports.betSync = async (data) => {
    try {
      const bettingData = await BettingTable.findOne({ rel_id: data.id });
  
      if (bettingData) {
        // Assuming `update_json` is a function you want to call (not shown in the original code)
        // You would implement this based on your requirements
        await updateJson({key:bettingData.rel_id,sports: bettingData._id});
  
        return { return: true, message: 'Bet sync done' };
      } else {
        return { return: false, message: 'Server problem' };
      }
    } catch (err) {
      console.error(err);
      return { return: false, message: 'Server problem' };
    }
  }
 exports.userbet = async (req,res) => {
  try {
    const { id } = req.params;

    // Find the betting entry by ID
    const bettingData = await BettingTable.findOne({ _id: id });
    if (!bettingData) {
      return res.status(404).json({ message: 'Betting entry not found' });
    }

    // Find grouped bet names with bet_win = 0 for the related sport_key
    const betNames = await BetHistoryTable.aggregate([
      { $match: { sport_key: bettingData.rel_id, bet_win: 0 } },
      { $group: { _id: "$bet_name" } }
    ]);

    // Count the matching documents with bet_win = 0
    const count = await BetHistoryTable.countDocuments({ sport_key: bettingData.rel_id, bet_win: 0 });

    return res.json({
      bet: bettingData,
      name: betNames.map(item => item._id),
      count: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
  }
 exports.bet_history = async (req,res) => {
  const { bet_id } = req.params;

  try {
    // Find the bet by bet_id
    const betHistory = await BetHistoryTable.findOne({ bet_id: parseInt(bet_id) });

    if (!betHistory) {
      return res.status(404).json({ message: 'Bet history not found' });
    }

    return res.json(betHistory);
  } catch (error) {
    console.error('Error fetching bet history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
  }
  
 exports.Apply = async (req,res) => {
  try {
    const { win, name,bet_name } = req.body;
    const winLossStatus = win === "true" ? 1 : 2;

    const updatedBet = await BetHistoryTable.findOneAndUpdate(
      { bet_name: bet_name},
      { user_id: name },
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
  


exports.DeleteBettingType = async (req, res) => {
    const { type } = req.params;
    const { sports_id, main_id, bookmark_id, market_id } = req.body;
  
    try {
      // Fetch the betting table using sports_id
      const bettingTable = await BettingTable.findOne({ rel_id: sports_id });
      
      if (!bettingTable) {
        return res.status(404).json({ return: false, message: 'Betting table not found' });
      }
  
      // Parse the 'manual' field if it exists and is valid
      let manual = bettingTable.manual ? JSON.parse(bettingTable.manual) : null;
      
      if (!manual || manual.length === 0) {
        return res.status(400).json({ return: false, message: 'Manual data is invalid' });
      }
  
      if (type === 'bookmark') {
        // Deleting the bookmark
        if (manual[main_id] && manual[main_id].bookmakers) {
          delete manual[main_id].bookmakers[bookmark_id];
          // Update the betting table with the modified manual
          bettingTable.manual = JSON.stringify(manual);
          await bettingTable.save();
          return res.json({ return: true });
        } else {
          return res.status(400).json({ return: false, message: 'Bookmark data not found' });
        }
      } else if (type === 'market') {
        // Deleting the market
        if (manual[main_id] && manual[main_id].bookmakers[bookmark_id] && manual[main_id].bookmakers[bookmark_id].markets) {
          delete manual[main_id].bookmakers[bookmark_id].markets[market_id];
          // Update the betting table with the modified manual
          bettingTable.manual = JSON.stringify(manual);
          await bettingTable.save();
          return res.json({ return: true });
        } else {
          return res.status(400).json({ return: false, message: 'Market data not found' });
        }
      } else {
        return res.status(400).json({ return: false, message: 'Invalid type' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ return: false, message: 'Server error' });
    }
  }



    exports.EditBettingType = async (req, res) => {
    const { type, data } = req.body;
    const { sports_id, main_id, bookmark_id, name, market_id } = data;
  
    try {
      const bettingTable = await BettingTable.findOne({ rel_id: sports_id });
  
      if (!bettingTable) {
        return res.status(404).json({ return: false });
      }
  
      let manual = bettingTable.manual ? JSON.parse(bettingTable.manual) : null;
      
      if (!manual || manual === '' || manual === '[]') {
        return res.status(400).json({ return: false });
      }
  
      // Update logic based on the type
      if (type === 'bookmark') {
        manual[main_id].bookmakers[bookmark_id].title = name;
        bettingTable.manual = JSON.stringify(manual);
        await bettingTable.save();
        return res.json({ return: true });
      } else if (type === 'market') {
        manual[main_id].bookmakers[bookmark_id].markets[market_id].name = name;
        bettingTable.manual = JSON.stringify(manual);
        await bettingTable.save();
        return res.json({ return: true });
      } else if (type === 'market_price') {
        manual[main_id].bookmakers[bookmark_id].markets[market_id].price = name;
        bettingTable.manual = JSON.stringify(manual);
        await bettingTable.save();
        return res.json({ return: true });
      } else {
        return res.status(400).json({ return: false });
      }
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ return: false });
    }
  }




// // Function to fetch active sports
// exports.Sportsbetting =async (req, res)=> {
//     try {
//       const sports = await BettingTable.find({
//         is_active: true,
//         rel_type: 'odds'
//       });
  
//       res.json(sports);
//     } catch (error) {
//       res.status(500).json({ message: 'Error fetching sports data', error });
//     }
//   }
  


  
  
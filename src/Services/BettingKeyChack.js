

// /**
//  * Betting key check function
//  * @param {String} key - The key to check.
//  * @param {String} type - The type to check (e.g., BETTING_ODDS).
//  * @returns {Promise<Number>} - Returns 1 if a record exists, 0 otherwise.
//  */
const bettingKeyCheck = async (key, type) => {
    try {
        switch (type) {
            case 'BETTING_ODDS':
                const data = await gameTable.findOne({ rel_id: key, rel_type: type });
                return data ? 1 : 0;

            default:
                return 0;
        }
    } catch (error) {
        console.error('Error in bettingKeyCheck:', error);
        return 0;
    }
};

// Example route to use the function
exports.bettingKeyCheckRoute = async (req, res) => {
    const { key, type } = req.query;

    if (!key || !type) {
        return res.status(400).json({ message: 'Key and type are required' });
    }

    try {
        const result = await bettingKeyCheck(key, type);
        res.json({ exists: result });
    } catch (error) {
        console.error('Error in route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

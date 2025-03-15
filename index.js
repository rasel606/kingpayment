
const app = require('./app'); // Import the main application





// const http = require('http');

// const httpServer = http.createServer(app);


// httpServer.listen(5000, () => {
//     console.log('Server running on http://localhost:5000');
// });
app.listen(5001, () => {
    console.log('Server running on http://localhost:5001');
});


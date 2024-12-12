const express = require('express');
//const { ensureDatabaseAndContainer, logActivity } = require('./db');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());
//I made a change here
// I also made a change here
//I also made a change here
//here as well
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//






// Ensure database and container are ready
// ensureDatabaseAndContainer().catch((error) => {
//     console.error('Error setting up Cosmos DB:', error);
//     process.exit(1);
// });

// API endpoint to log activity


// API endpoint to track activity
app.post('/track-activity', async (req, res) => {
    try {
        const activity = req.body;

        // Validate payload
        if (!activity || !activity.timestamp || !activity.user || !activity.command) {
            console.error('Invalid payload:', activity);
            return res.status(400).send({ error: 'Invalid payload structure' });
        }

        console.log('Activity received:', activity);

        // Simulate processing the activity
        console.log('Activity processed successfully.');

        // Respond with success
        res.status(200).send({ message: 'Activity logged successfully', activity });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send({ error: 'Internal Server Error', details: error.message });
    }
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
});

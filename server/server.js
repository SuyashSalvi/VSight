// const WebSocket = require('ws');
// const express = require('express');
// const http = require('http');

// // Create an Express application
// const app = express();

// // Create an HTTP server to use with both Express and WebSocket
// const server = http.createServer(app);

// // Create a WebSocket Server
// const wss = new WebSocket.Server({ server });

// // Array to keep track of connected clients
// let clients = [];

// // Handle WebSocket connections
// wss.on('connection', (ws) => {
//     console.log('New client connected at', new Date().toISOString());
//     clients.push(ws);

//     // Listen for messages from the client
//     ws.on('message', (message) => {
//         // Convert Buffer to string and parse it as JSON
//         const data = JSON.parse(message.toString());

//         console.log('Received:', data);

//         // Broadcast the message to all other clients
//         clients.forEach((client) => {
//             if (client !== ws && client.readyState === WebSocket.OPEN) {
//                 client.send(JSON.stringify(data)); // Send the parsed data as JSON
//             }
//         });
//     });

//     // Handle client disconnection
//     ws.on('close', () => {
//         console.log('Client disconnected at', new Date().toISOString());
//         clients = clients.filter((client) => client !== ws);
//     });
// });

// // Start the server
// const PORT = 3000;
// server.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Create an Express application
const app = express();

// Create an HTTP server to use with both Express and WebSocket
const server = http.createServer(app);

// Create a WebSocket Server
const wss = new WebSocket.Server({ server });

// Array to keep track of connected clients
let clients = [];

// In-memory document state
let documentState = {
    content: 'Initial document content',
    lastUpdated: new Date().toISOString(),
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    const userId = generateUniqueId(); // Assign a unique ID to each client
    ws.userId = userId; // Attach userId to the WebSocket object
    console.log(`New client connected: User ${userId} at`, new Date().toISOString());

    // Send the current document state to the newly connected client
    ws.send(JSON.stringify({
        type: 'initialState',
        content: documentState.content,
        lastUpdated: documentState.lastUpdated,
    }));

    // Add the new client to the list
    clients.push(ws);

    // Broadcast the updated user list
    broadcastUserList();

    // Listen for messages from the client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
    
            console.log(`Received message from User ${ws.userId}:`, data);
    
            if (data.type === 'edit') {
                // Conflict detection
                if (new Date(data.timestamp) < new Date(documentState.lastUpdated)) {
                    // Conflict detected
                    ws.send(JSON.stringify({
                        type: 'conflictDetected',
                        details: 'Your edit was based on an outdated version of the document.',
                        currentContent: documentState.content,
                    }));
                    return;
                }
    
                // Update the document state
                documentState.content = data.content;
                documentState.lastUpdated = new Date().toISOString();
    
                // Broadcast the updated content to all other clients
                broadcastMessage(ws, {
                    type: 'updateDocument',
                    content: documentState.content,
                });
            } else {
                console.warn(`Unknown message type from User ${ws.userId}:`, data.type);
            }
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });
    

    // Handle client disconnection
    ws.on('close', () => {
        console.log(`Client disconnected: User ${userId} at`, new Date().toISOString());
        clients = clients.filter((client) => client !== ws);
        broadcastUserList();
    });
});

// Broadcast a message to all connected clients except the sender
function broadcastMessage(sender, message) {
    clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Broadcast the list of connected users
function broadcastUserList() {
    const userList = clients.map((client) => client.userId);
    const message = {
        type: 'userListUpdate',
        users: userList,
    };
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Generate a unique ID for each user
function generateUniqueId() {
    return `User${Math.floor(Math.random() * 10000)}`;
}

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

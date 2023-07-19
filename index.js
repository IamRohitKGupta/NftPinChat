const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http'); // Import the built-in http module
const socketIO = require('socket.io'); // Import Socket.IO

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app); // Create an HTTP server instance
const io = socketIO(server); // Pass the server to Socket.IO

// Define the allowed origin
const allowedOrigin = 'https://nftpin.xyz';

// Enable CORS with origin option
app.use(
  cors({
    origin: allowedOrigin,
  })
);

const chats = [];

// Add a new chat message
app.post('/chats', (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const newChat = {
    timestamp: Date.now(),
    message: message.trim().substring(0, 999),
  };

  chats.push(newChat);

  // Remove the oldest chat if the maximum limit is reached
  if (chats.length > 100) {
    chats.shift();
  }

  // Emit the new chat message to all connected clients
  io.emit('newChatMessage', newChat);

  res.status(201).json({ message: 'Chat message added successfully' });
});

// Retrieve all chat messages
app.get('/chats', (req, res) => {
  res.json(chats);
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Socket.IO event for new client connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the current chats to the newly connected client
  socket.emit('chats', chats);

  // Handle disconnection event (optional)
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

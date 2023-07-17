const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Define the allowed origin
const allowedOrigin = 'https://nftpin.xyz';

// Enable CORS with origin option
/*
app.use(
  cors({
    origin: allowedOrigin,
  })
);
*/

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

  res.status(201).json({ message: 'Chat message added successfully' });
});

// Retrieve all chat messages
app.get('/chats', (req, res) => {
  res.json(chats);
});

const port = 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

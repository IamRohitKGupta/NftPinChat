const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const server = app.listen((process.env.PORT || 8000), '0.0.0.0', () => {
  console.log(`Server listening on port ${process.env.PORT || 8000}`);
});

const io = new Server(server, {
  cors: {
    origin: 'https://nftpin.xyz',
    methods: ['GET', 'POST'],
  },
});

// SSL/TLS configuration
const sslConfig = {
  rejectUnauthorized: true,
};

// Create a MySQL database connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DB,
  port: 3306,
  ssl: sslConfig,
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Add a new chat message to the MySQL database
app.post('/chats', (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const newChat = {
    timestamp: Date.now(),
    message: message.trim().substring(0, 999),
  };

  // Check the number of messages in the database
  connection.query('SELECT COUNT(*) AS messageCount FROM chats', (err, results) => {
    if (err) {
      console.error('Error checking message count in MySQL database:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const messageCount = results[0].messageCount;

    // If there are more than 100 messages, delete the oldest message
    if (messageCount >= 5) {
      connection.query('DELETE FROM chats ORDER BY timestamp ASC LIMIT 1', (err, deleteResult) => {
        if (err) {
          console.error('Error deleting oldest message in MySQL database:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('Oldest chat message deleted from MySQL database:', deleteResult);
      });
    }

    // Insert the new chat message into the MySQL database
    connection.query(
      'INSERT INTO chats (timestamp, message) VALUES (?, ?)',
      [newChat.timestamp, newChat.message],
      (err, insertResult) => {
        if (err) {
          console.error('Error adding chat message to MySQL database:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('Chat message added to MySQL database:', insertResult);

        // Emit the new chat message to all connected clients
        io.emit('newChatMessage', newChat);

        res.status(201).json({ message: 'Chat message added successfully' });
      }
    );
  });
});

// Retrieve all chat messages from the MySQL database
app.get('/chats', (req, res) => {
  // Retrieve all chat messages from the MySQL database
  connection.query('SELECT * FROM chats', (err, results) => {
    if (err) {
      console.error('Error retrieving chat messages from MySQL database:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// Socket.IO event for new client connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Retrieve all chat messages from the MySQL database
  connection.query('SELECT * FROM chats', (err, results) => {
    if (err) {
      console.error('Error retrieving chat messages from MySQL database:', err);
      return;
    }
    const chats = results.map((chat) => ({
      timestamp: chat.timestamp,
      message: chat.message,
    }));

    // Send the current chats to the newly connected client
    socket.emit('chats', chats);
  });

  // Handle disconnection event (optional)
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

//Testing
/*
const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// SSL/TLS configuration
const sslConfig = {
  rejectUnauthorized: true,
};

// Create a MySQL database connection
const connection = mysql.createConnection({
  host: 'aws.connect.psdb.cloud',//'db4free.net',
  user: 'tcq4hy9w1l0biv78i05q',//'nftpinadmin',
  password: 'pscale_pw_OxuZ5BOzsnf2NzkvlSFvChP9HnUHv0egC9MbqvT4DFA',//'JFKbbidel',
  database: 'nftpin_db',//'nftpindb',
  port: 3306,//3306,
  ssl: sslConfig,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});
*/
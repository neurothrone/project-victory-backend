// !: Setup
require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("./models/message");
const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const cors = require("cors");

const CLIENT_URL = process.env.DEV_CLIENT_BASE_URL;
// const CLIENT_URL = process.env.PROD_CLIENT_BASE_URL;

// !: Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cors({
  origin: CLIENT_URL
}));

// !: Websocket
let connectedUsers = [];

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const {username} = socket.handshake.query;
  if (username) {
    connectedUsers.push(username);
    console.log(`${username} has connected.`);
  }

  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter(user => user !== username);
    console.log(`${username} disconnected`);
  });
});

// !: Endpoints
app.post(
  "/api/username",
  async (req, res) => {
    try {
      const {username} = req.body;
      if (connectedUsers.includes(username)) {
        return res.status(200).json({isTaken: true});
      }

      return res.status(200).json({isTaken: false});
    } catch (error) {
      console.log(error);
      res.status(500).json({error: "An unexpected error has occurred: " + error.message});
    }
  }
);

app.get(
  "/api/messages",
  async (req, res) => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    console.log(sixHoursAgo); // Outputs something like 1674460800000
    try {
      const storedMessages = await Message.find({}).sort({timestamp: 1});
      res.json(storedMessages);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get("/api/msg", async (req, res) => {
  try {
    // Get the 'since' query parameter
    const {since} = req.query;

    // Parse 'since' and validate it
    let filter = {};
    if (since) {
      const sinceTimestamp = parseInt(since, 10); // Convert 'since' to an integer
      if (!isNaN(sinceTimestamp)) {
        filter = {timestamp: {$gte: new Date(sinceTimestamp)}}; // Filter messages by timestamp
      } else {
        return res.status(400).json({error: "Invalid 'since' timestamp provided."});
      }
    }

    // Fetch messages with the applied filter
    const storedMessages = await Message.find(filter).sort({timestamp: 1});

    // Return the filtered messages
    res.json(storedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({error: "Failed to fetch messages."});
  }
});

app.post(
  "/api/messages",
  async (req, res) => {
    try {
      const {username, text, Date: messageDate} = req.body;

      if (!username) {
        return res.status(400).json({error: "Username is required."});
      }

      if (!text) {
        return res.status(400).json({error: "Text is required."});
      }

      const max_msg_length = 256;
      if (text.length > max_msg_length) {
        return res.status(400).json({
          error: `message cannot exceed ${max_msg_length} characters.`
        });
      }
      const now = Date.now();
      const receivedTimestamp = messageDate
        ? new Date(messageDate).getTime()
        : now;
      const max_allowed_drift = 1000 * 60; // allow 1 minute drift since date is measured in milliseconds.
      if (messageDate &&
        isNaN(receivedTimestamp) || Math.abs(receivedTimestamp - now) > max_allowed_drift) {
        return res.status(400).json({error: "invalid message timestamp. No past or future messages."});
      }

      const messageData = {
        username,
        text,
        timestamp: now, // Always use the server's timestamp
      };

      const newMessage = await Message.create(messageData);

      io.emit("message", newMessage);
      res.status(201).json(newMessage);
    } catch (error) {
      console.log(error.message)
      res.status(404);
    }
  }
);

// !: Start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to mongodb");
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => console.log(error));

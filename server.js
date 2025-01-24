require("dotenv").config();
const mongoose = require("mongoose");
const msgLog = require("./mongoose")
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const cors = require("cors");

const CLIENT_URL = "https://nice-grass-0741fb703.4.azurestaticapps.net";

app.use(express.static("public"));
app.use(express.json());
app.use(cors({
  origin: CLIENT_URL,
}));

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.get(
  "/api/messages",
  async (req, res) => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    console.log(sixHoursAgo); // Outputs something like 1674460800000
    try {
      const storedMessages = await msgLog.find({}).sort({ timestamp: 1 });
      res.json(storedMessages);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get("/api/msg", async (req, res) => {
  try {
    // Get the 'since' query parameter
    const { since } = req.query;

    // Parse 'since' and validate it
    let filter = {};
    if (since) {
      const sinceTimestamp = parseInt(since, 10); // Convert 'since' to an integer
      if (!isNaN(sinceTimestamp)) {
        filter = { timestamp: { $gte: new Date(sinceTimestamp) } }; // Filter messages by timestamp
      } else {
        return res.status(400).json({ error: "Invalid 'since' timestamp provided." });
      }
    }

    // Fetch messages with the applied filter
    const storedMessages = await msgLog.find(filter).sort({ timestamp: 1 });

    // Return the filtered messages
    res.json(storedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});



app.post(
  "/api/messages/",
  async (req, res) => {
    try {
      const message = await msgLog.create(req.body);
      if (!message || message.Date !== Date.now()) {
        return res.status(400).json({ error: "Text is required & no past/future messages." });
      }

      const max_msg_length = 256;
      if(message.length > max_msg_length){
        return res.status(400).json({
          error:`message cannot exceed ${max_msg_length} characters.`
        });
      }


      io.emit("message", message);
      res.json(message);
    } catch (error) {
      console.log(error.message)
      res.status(404);
    }
  }
);



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to mongodb");
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => console.log(error));

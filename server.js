require("dotenv").config();
const mongoose = require("mongoose");
const msgLog = require("./mongoose")
const express = require("express");
const http = require("https");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const cors = require("cors");

const CLIENT_URL = "https://nice-grass-0741fb703.4.azurestaticapps.net";

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

app.use(express.static("public"));
app.use(express.json());
app.use(cors({
  origin: CLIENT_URL,
}));

app.get(
  "/api/messages",
  async(req, res) => {
    try{
      const storedMessages = await msgLog.find({}).sort({timestamp: 1});
      res.json(storedMessages);
    }
    catch (error){
      console.log(error);
    }
  }
);

app.post(
  "/api/messages",
  async (req, res) => {
    try {
      const message = await msgLog.create(req.body);
      if (!message) {
        return res.status(400).json({ error: "Text is required" });
      }
      io.emit("message", message);
      res.json(message);
    }
    catch (error) {
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
  });

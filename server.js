require("dotenv").config();
const mongoose = require("mongoose");
const msgLog = require("./mongoose")
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

app.get(
  "/api/messages",
  async(req, res) => {
    const storedMessages = await msgLog.find({}).sort({timestamp: 1});
    console.log("Getting all messages" + storedMessages);
    res.json(storedMessages);
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
      res.json(message);
    }
    catch (error) {
      console.log(error.message)
      res.status(404);
    }
  }
);

mongoose.
connect(process.env.MONGO_URI)
.then(() => {
  console.log("connected to mongodb");
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })
  
});

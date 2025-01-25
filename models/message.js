const mongoose = require("mongoose");
const messageSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  }
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
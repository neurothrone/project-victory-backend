const mongoose = require("mongoose");
const messageSchema = mongoose.Schema({
    username:{
        type: String,
        required: false
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const usernameSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    }
        
})


const logMessages = mongoose.model("Messagelog", messageSchema);
const logUsername = mongoose.model("Usernamelogs",usernameSchema);
module.exports = logMessages;

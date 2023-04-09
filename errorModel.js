const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    code: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    route: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('errors', schema);
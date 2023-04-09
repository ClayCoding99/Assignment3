const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    user: {
        email: {
            required: true,
            type: String,
        },
        username: {
            required: true,
            type: String,
        },
    },
    route: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    count: {
        type: Number,
        default: 0,
    }
});

module.exports = mongoose.model('requests', schema);
    
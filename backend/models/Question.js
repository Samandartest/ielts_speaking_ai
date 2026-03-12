const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    // Masalan: "Where is your hometown?"
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  order: {
    type: Number,
    required: true,
    // Savollar tartibini belgilash uchun
  },
});

module.exports = mongoose.model('Question', questionSchema);
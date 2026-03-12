const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partNumber: {
    type: Number,
    required: true,
    enum: [1, 2, 3], // Faqat Part 1, 2, 3
  },
  title: {
    type: String,
    required: true,
    // Masalan: "Part 1 - Introduction & Interview"
  },
  description: {
    type: String,
    // Masalan: "Examiner asks general questions about familiar topics"
  },
});

module.exports = mongoose.model('Part', partSchema);
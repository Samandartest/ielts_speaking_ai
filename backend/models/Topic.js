const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // Masalan: "Hometown", "Work", "Education"
  },
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true,
  },
});

module.exports = mongoose.model('Topic', topicSchema);
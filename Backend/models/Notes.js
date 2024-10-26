const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notesSchema = new Schema({
  // User information
  userId: {
    type: String,
    required: true,
  },
  // Note details
  timestamp: {
    type: Date,
    default: () => Date.now(),
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isImportant: {
    type: Boolean,
    default: false, // Optional, defaults to false if not specified
  },
});

module.exports = mongoose.model("Notes", notesSchema);

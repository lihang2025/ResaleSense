// ResaleSense-Backend/models/supportMessage.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupportMessageSchema = new Schema({
  userId: { // This *always* refers to the customer/user
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for faster lookups by user
  },
  senderType: { // To know who sent it
    type: String,
    enum: ['User', 'Admin'],
    required: true,
  },
  adminId: { // Optional: Link to the Admin User who replied
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Only present if senderType is 'Admin'
  },
  messageText: {
    type: String,
    required: true,
  },
  isReadByAdmin: { // Tracks if the *admin* has seen a *user's* message
    type: Boolean,
    default: false,
  },
  // Add isReadByUser later if needed
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('SupportMessage', SupportMessageSchema);
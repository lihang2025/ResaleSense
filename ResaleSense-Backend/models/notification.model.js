// ResaleSense-Backend/models/notification.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  // The user who will receive the notification
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // The message to display (e.g., "An admin has replied to your message.")
  message: { 
    type: String, 
    required: true 
  },
  
  // A link to navigate to when the notification is clicked
  link: { 
    type: String, 
    required: true 
  },
  
  // Has the user read this notification?
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create an index on userId and isRead for fast querying
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
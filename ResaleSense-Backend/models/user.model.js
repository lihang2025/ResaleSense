// ResaleSense-Backend/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no two users can have the same email
  },
  password: {
    type: String,
    required: true, // We will hash this before saving
  },
  contactNumber: {
    type: String,
  },
  role: {
    type: String,
    enum: ['Consumer', 'Admin'], // Only allows these two values
    default: 'Consumer',
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'banned'],
    default: 'active',
  },
  banDuration: { type: String, default: null },
  banExpiresAt: { type: Date, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bookmarks: [{
    type: Number,
    ref: 'Property'
  }],
  warnings: [{
    message: String,
    issuedAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],

  // --- ADD THESE VERIFICATION FIELDS ---
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationRequestedAt: { type: Date, default: Date.now },
  verificationDocumentUrl: { type: String } // Optional: If users upload documents
  // --- END ADDITIONS ---
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
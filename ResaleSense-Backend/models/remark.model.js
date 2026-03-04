// ResaleSense-Backend/models/remark.model.js
const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  propertyId: {
    type: Number, 
    ref: 'Property',
    required: false, 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  town: {
    type: String,
    required: true,
    index: true 
  },
  text: {
    type: String,
    required: true,
  },
  valuationVote: {
    type: String,
    enum: ['Over-valued', 'Fair Value', 'Under-valued'],
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  communityValuation: {
    type: Number,
    required: false,
  },
  // --- NEW: Field to track edits ---
  isEdited: {
    type: Boolean,
    default: false,
  }
  // --- END NEW ---
});

const Remark = mongoose.model('Remark', remarkSchema);

module.exports = Remark;
// ResaleSense-Backend/models/property.model.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // This unique ID will come from the data.gov.sg dataset
  // to prevent duplicate entries when we fetch data.
  _id: { type: Number, required: true },
  month: { type: String, required: true }, // e.g., "2024-05"
  town: { type: String, required: true },
  flat_type: { type: String, required: true },
  block: { type: String, required: true },
  street_name: { type: String, required: true },
  storey_range: { type: String, required: true },
  floor_area_sqm: { type: Number, required: true },
  flat_model: { type: String, required: true },
  lease_commence_date: { type: Number, required: true },
  remaining_lease: { type: String, required: true }, // e.g., "99 years 01 month"
  resale_price: { type: Number, required: true },
});

// We disable Mongoose's default '_id' generation since we're using the one from the dataset.
const Property = mongoose.model('Property', propertySchema, 'properties');

module.exports = Property;
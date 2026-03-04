// ResaleSense-Backend/seed.js (Final Version with Pagination)
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const Property = require('./models/property.model');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connection established for seeding.');

    console.log('Clearing existing property data...');
    await Property.deleteMany({});

    const resourceId = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
    const PAGE_SIZE = 5000; // How many records to fetch per API call

    // 1. First, make a small call to find the total number of records
    console.log('Discovering total number of records...');
    const initialResponse = await axios.get(`https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=1`);
    const totalRecords = initialResponse.data.result.total;
    console.log(`Found ${totalRecords} total records in the dataset.`);

    // 2. Create an array of all the API calls we need to make
    const fetchPromises = [];
    for (let offset = 0; offset < totalRecords; offset += PAGE_SIZE) {
      const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=${PAGE_SIZE}&offset=${offset}`;
      fetchPromises.push(axios.get(url));
      console.log(`Preparing to fetch records from offset ${offset}...`);
    }

    // 3. Run all the API calls in parallel for efficiency
    console.log(`\nStarting to fetch all ${fetchPromises.length} pages. This may take a few minutes...`);
    const responses = await Promise.all(fetchPromises);
    console.log('All data has been downloaded.');

    // 4. Combine the records from all pages into a single array
    let allRecords = [];
    for (const response of responses) {
      allRecords.push(...response.data.result.records);
    }

    // 5. Filter the records to keep only those from 2020 onwards
    console.log(`Filtering ${allRecords.length} records to keep data from 2020 onwards...`);
    const filteredRecords = allRecords.filter(record => record.month >= '2020-01');
    console.log(`Found ${filteredRecords.length} records since January 2020.`);

    // 6. Insert the final, clean data into the database
    console.log('Inserting filtered data into the database...');
    await Property.insertMany(filteredRecords);
    console.log('✅ Database has been successfully seeded with the complete dataset!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase();
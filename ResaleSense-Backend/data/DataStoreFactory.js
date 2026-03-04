// ResaleSense-Backend/data/DataStoreFactory.js
const MongoDBImpl = require('./MongoDBImpl');
const MySQLImpl = require('./MySQLImpl'); // 1. Import your new implementation

let dataStore = null;

const getDataStore = () => {
  if (dataStore) {
    return dataStore;
  }

  // 2. Read the type from your environment variables
  const dataStoreType = process.env.DATASTORE_TYPE || 'mongodb'; // Default to 'mongodb'

  // 3. Use a switch to decide which implementation to create
  switch (dataStoreType) {
    case 'mysql':
      console.log('✅ DataStore initializing with MySQL implementation...');
      dataStore = new MySQLImpl();
      break;
    
    case 'mongodb':
    default:
      console.log('✅ DataStore initializing with MongoDB implementation...');
      dataStore = new MongoDBImpl();
      break;
  }

  return dataStore;
};

module.exports = { getDataStore };
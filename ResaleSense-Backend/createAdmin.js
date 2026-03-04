const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const prompt = require('prompt-sync')(); // For getting user input
require('dotenv').config(); // Load environment variables from .env

const connectDB = require('./config/database');
const User = require('./models/user.model');

/**
 * This is a standalone script to create a new user with the 'Admin' role.
 * To run it, navigate to the /ResaleSense-Backend folder in your terminal
 * and run: node createAdmin.js
 */
async function createAdmin() {
  console.log('--- ResaleSense Admin Creation Utility ---');

  try {
    // 1. Connect to the database
    await connectDB();
    console.log('Database connection successful.');

    // 2. Get input from the user
    const name = prompt('Enter Admin Name: ');
    const email = prompt('Enter Admin Email: ');
    const password = prompt('Enter Admin Password: ', { echo: '*' }); // echo: '*' masks password
    
    if (!name || !email || !password) {
      console.error('\nError: All fields are required. Aborting.');
      return;
    }

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error('\nError: An account with this email already exists.');
      return;
    }

    // 4. Hash the password (same as in index.js)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create the new User object
    const adminUser = new User({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Admin', // This is the magic part
      status: 'active',
      verificationStatus: 'verified' // <-- ADD THIS LINE
    });

    // 6. Save the user to the database
    await adminUser.save();
    
    console.log('\n✅ Success!');
    console.log(`Admin user "${name}" (${email}) has been created.`);

  } catch (error) {
    console.error('\n❌ An error occurred:');
    console.error(error.message);
  } finally {
    // 7. Ensure we disconnect from the DB
    await mongoose.disconnect();
    console.log('\nDatabase disconnected. Exiting.');
  }
}

// Run the function
createAdmin();
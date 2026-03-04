// ResaleSense-Backend/index.js (Complete Version with Authentication)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const connectDB = require('./config/database');
const { getDataStore } = require('./data/DataStoreFactory');
const Remark = require('./models/remark.model.js');
const mongoose = require('mongoose');
const SupportMessage = require('./models/supportMessage.model.js');

// --- INITIALIZATION ---
const app = express();
const PORT = 4000;
connectDB();
const db = getDataStore(); // This now includes db.Notification

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- API ENDPOINTS ---

app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password, contactNumber } = req.body;

        // --- NEW: Check for existing name ---
        const existingName = await db.User.findOne({ name: name }); // Check if name exists
        if (existingName) {
            // Use 409 Conflict status code for duplicates
            return res.status(409).json({ error: "Registration failed. This username is already taken." });
        }
        // --- END NAME CHECK ---

        // --- NEW: Check for existing email (redundant due to schema, but explicit) ---
        const existingEmail = await db.User.findOne({ email: email });
        if (existingEmail) {
             // Use 409 Conflict status code for duplicates
            return res.status(409).json({ error: "Registration failed. This email is already in use." });
        }
        // --- END EMAIL CHECK ---


        // Hash the password (Unchanged)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (Unchanged)
        const newUser = await db.createUser({
            name,
            email,
            password: hashedPassword,
            contactNumber
        });
        res.status(201).json({ message: "User registered successfully!", userId: newUser._id });

    } catch (error) {
        // --- UPDATED: Catch block for better duplicate email detection ---
        console.error("Registration Error:", error); // Log the full error for debugging

        // Check if it's a Mongoose duplicate key error (code 11000)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Send a specific 409 Conflict response for duplicate email
            res.status(409).json({ error: "Registration failed. This email is already in use." });
        }
        // Check if it's a Mongoose duplicate key error for name (if you were to add unique index later)
        else if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
             res.status(409).json({ error: "Registration failed. This username is already taken." });
        }
        else {
            // For other errors, send a generic 400 or 500 error
             res.status(400).json({ error: "Registration failed due to invalid data or server issue." });
        }
        // --- END UPDATED CATCH ---
    }
});

app.get('/api/admin/support/unread-users', async (req, res) => {
  // ... (unchanged)
  try {
    const users = await SupportMessage.aggregate([
      { $match: { 
          isReadByAdmin: false, 
          senderType: 'User' 
      }},
      { $group: { 
          _id: '$userId' 
      }},
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
      }},
      { $unwind: '$userDetails' },
      { $project: {
          _id: '$userDetails._id',
          name: '$userDetails.name',
          email: '$userDetails.email'
      }}
    ]);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with unread messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/support/read-users', async (req, res) => {
  try {
    // This new function finds users who have messages, but none are unread
    const users = await db.getUsersWithReadMessages();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with read messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/support/messages/mark-read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // In a real app, you'd verify admin auth here
    
    const result = await db.markUserMessagesAsReadByAdmin(userId);
    
    res.json({ 
      message: 'Messages marked as read.',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Error marking support messages as read:", err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/admin/support/messages', async (req, res) => {
  try {
    // Find distinct user IDs who have messages not read by admin
    const userIdsWithUnread = await db.SupportMessage.distinct('userId', { isReadByAdmin: false });

    if (!userIdsWithUnread || userIdsWithUnread.length === 0) {
        return res.json([]); // Return empty array if no users have unread messages
    }

    // Fetch user details for these IDs
    const users = await db.User.find({ '_id': { $in: userIdsWithUnread } })
                               .select('_id name email') // Select only needed fields
                               .sort({ name: 1 }); // Sort alphabetically

    res.json(users); // Send the list of users

  } catch (err) {
    console.error("Error fetching users with unread support messages:", err.message);
    res.status(500).send('Server Error fetching user list.');
  }
});
app.put('/api/admin/support/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await db.SupportMessage.findByIdAndUpdate(
      messageId,
      { isReadByAdmin: true },
      { new: true } // Return the updated document
    );

    if (!message) {
      return res.status(404).json({ error: 'Support message not found.' });
    }

    res.json({ message: 'Message marked as read.', id: message._id });

  } catch (err) {
    console.error("Error marking support message as read:", err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/support/messages', async (req, res) => {
  try {
    const { userId, messageText } = req.body;

    if (!userId || !messageText) {
      return res.status(400).json({ error: 'User ID and message text are required.' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await db.createSupportMessage({
      userId,
      messageText,
      senderType: 'User', 
      isReadByAdmin: false 
    });

    res.status(201).json({ message: 'Support message sent successfully.' });

  } catch (err) {
    console.error("Error creating support message:", err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/support/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Basic check: In a real app, verify if the requester is the user OR an admin
    // For now, we assume the frontend sends the correct userId
    const messages = await db.getSupportMessagesForUser(userId);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching support messages for user:", err.message);
    res.status(500).send('Server Error fetching messages.');
  }
});

app.post('/api/admin/support/reply/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { messageText, adminId } = req.body; 

    if (!userId || !messageText || !adminId) {
      return res.status(400).json({ error: 'Target User ID, Admin ID, and message text are required.' });
    }

    const admin = await db.User.findById(adminId);
    if (!admin || admin.role !== 'Admin') {
       return res.status(403).json({ error: 'Invalid admin ID or insufficient permissions.' });
    }
    const user = await db.User.findById(userId);
    if (!user) {
       return res.status(404).json({ error: 'Target user not found.' });
    }

    // 1. Create the support message (unchanged)
    const newMessage = await db.createSupportMessage({
      userId: userId,
      messageText: messageText,
      senderType: 'Admin',
      adminId: adminId,
      isReadByAdmin: true
    });

    // --- 2. NEW: Create a notification for the user ---
    await db.createNotification({
      userId: userId,
      message: "An admin has replied to your support message.",
      link: "/customer-support" // This link will take them to the support page
    });
    // --- END NEW ---

    res.status(201).json(newMessage); // Return the created message

  } catch (err) {
    console.error("Error sending admin reply:", err.message);
    res.status(500).send('Server Error sending reply.');
  }
});

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Add auth check here: is this user or an admin?
    const notifications = await db.getNotificationsForUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body; // Sent by frontend to verify ownership
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for authorization.'});
    }

    const notification = await db.markNotificationAsRead(notificationId, userId);
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

app.get('/api/notifications/unread-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await db.getUnreadNotificationCount(userId);
    res.json({ count: count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ error: 'Failed to fetch notification count.' });
  }
});

// PUT to mark ALL notifications as read
app.put('/api/notifications/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Add auth check here
    await db.markAllNotificationsAsRead(userId);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

// --- NEW: User Login Endpoint ---
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.findUserByEmail(email);

        // Check if user exists and if password is correct 
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        if (user.status === 'banned') {
            const now = new Date();
            // Check if ban is permanent or still active
            if (!user.banExpiresAt || user.banExpiresAt > now) {
                const expiryMessage = user.banExpiresAt
                    ? `Your ban expires on ${user.banExpiresAt.toLocaleString('en-SG')}.`
                    : 'This ban is permanent.';
                // Send a specific status code (e.g., 403 Forbidden) and the message
                return res.status(403).json({
                    error: 'ACCOUNT_BANNED', // Specific error code for frontend
                    message: `Your account is currently banned. ${expiryMessage}`
                });
            } else {
                // Ban has expired, reactivate the user
                console.log(`Ban expired for user ${user.email}. Reactivating account.`);
                user.status = 'active';
                user.banDuration = null;
                user.banExpiresAt = null;
                await user.save();
                // Continue with login...
            }
        }
        // --- END BAN CHECK ---

        // On success (or after reactivation), send back user info
        res.json({
            message: "Login successful!",
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              bookmarks: user.bookmarks,
              role: user.role,
              warnings: user.warnings || [],
              verificationStatus: user.verificationStatus
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "An unexpected server error occurred during login." });
    }
});


app.get('/api/area/:townName', async (req, res) => {
  try {
    const searchRegex = new RegExp(req.params.townName, 'i');
    const properties = await db.getProperties({ town: searchRegex });
    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: 'No properties found for this area.' });
    }
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties by town:', error);
    res.status(500).json({ error: 'Failed to retrieve property data.' });
  }
});


app.get('/api/properties/distinct-options', async (req, res) => {
  try {
    // Run fetches in parallel
    const [towns, flatTypes, flatModels, stats] = await Promise.all([
      db.getDistinctFieldValues('town'),
      db.getDistinctFieldValues('flat_type'),
      db.getDistinctFieldValues('flat_model'), // <-- NEW
      db.getPropertyStats()
    ]);

    res.json({
      towns: towns.sort(),
      flatTypes: flatTypes.sort(),
      flatModels: flatModels.sort(), // <-- NEW
      stats: stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get filter options.' });
  }
});

app.get('/api/properties/town-averages', async (req, res) => {
  try {
    const townAverages = await db.getTownAveragePrices();
    res.json(townAverages);
  } catch (error) {
    console.error('Error fetching town average prices:', error);
    res.status(500).json({ error: 'Failed to retrieve town averages.' });
  }
});

app.post('/api/properties/with-coords', async (req, res) => {
  try {
    const { flat_model, min_lease, ...filters } = req.body;
    const HARD_LIMIT = 200;
    
    const allFilters = { ...filters, flat_model, min_lease };

    let propertiesArray;

    if (Object.keys(allFilters).length > 0) {
      console.log('[Node.js] Received map request with filters:', allFilters);
      const result = await db.filterProperties(allFilters, 1, HARD_LIMIT); 
      propertiesArray = result.properties;
    } else {
      console.log('[Node.js] Received map request with no filters. Fetching recent properties.');
      propertiesArray = await db.getProperties({}, HARD_LIMIT);
    }

    const limitedProperties = propertiesArray.slice(0, HARD_LIMIT);
    
    // --- UPDATED: Pass the full property objects to get coords ---
    console.log(`[Node.js] Fetching coordinates for ${limitedProperties.length} full property objects...`);
    const coordPromises = limitedProperties.map(getCoordsForProperty);
    const propertiesWithCoords = await Promise.all(coordPromises);
    // --- END UPDATE ---
    
    const validProperties = propertiesWithCoords.filter(p => p !== null && p.latitude && p.longitude);
    res.json(validProperties);

  } catch (error) {
    console.error('[Node.js] Error fetching properties with coordinates:', error);
    res.status(500).json({ error: 'Failed to retrieve map data.' });
  }
});


app.post('/api/properties/:id/predict-range', async (req, res) => {
  try {
    const property = await db.getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found.' });

    const { startYear, endYear } = req.body;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    
    const dataForPython = {
      property: {
        town: property.town, flat_type: property.flat_type,
        storey_range: property.storey_range, floor_area_sqm: property.floor_area_sqm,
        flat_model: property.flat_model, lease_commence_date: property.lease_commence_date,
        remaining_lease: property.remaining_lease, block: property.block,
        street_name: property.street_name
      },
      years: years
    };
    
    console.log('[Node.js] Sending batch prediction request with address to Python...');
    const pythonResponse = await axios.post('http://localhost:5000/predict-range', dataForPython);
    
    res.json(pythonResponse.data);
  } catch (error) {
    console.error('[Node.js] FATAL ERROR calling Python service for range.', error.message);
    res.status(500).json({ error: 'Failed to get range prediction.' });
  }
});

// ResaleSense-Backend/index.js

// --- ADD THIS ROUTE BACK ---
app.post('/api/properties/filter', async (req, res) => {
  try {
    // --- UPDATED: Add flat_model and min_lease ---
    const { page = 1, limit = 10, flat_model, min_lease, ...filters } = req.body;
    console.log("[Node.js] Received filter request. Page:", page, "Limit:", limit, "Criteria:", filters, "FlatModel:", flat_model, "MinLease:", min_lease);
    
    const allFilters = {
        ...filters,
        flat_model,
        min_lease
    };
    // --- END UPDATE ---

    const { properties: propertiesFromDb, totalCount } = await db.filterProperties(allFilters, page, limit);

    if (!propertiesFromDb || propertiesFromDb.length === 0) {
      return res.status(200).json({ properties: [], totalCount: totalCount });
    }

    const plainProperties = propertiesFromDb.map(p => p.toObject());
    const coordPromises = plainProperties.map(getCoordsForProperty);
    const propertiesWithCoords = await Promise.all(coordPromises);
    res.json({ properties: propertiesWithCoords, totalCount: totalCount });

  } catch (error) {
    console.error("Error filtering properties:", error);
    res.status(500).json({ error: "Failed to filter properties." });
  }
});

app.post('/api/properties/compare', async (req, res) => {
  try {
    const { ids } = req.body; 

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Property IDs must be provided as a non-empty array.' });
    }

    console.log(`[Node.js] Received request to compare ${ids.length} properties.`);
    
    const properties = await db.getPropertiesByIds(ids);

    // --- FIX: Map properties to add coordinates ---
    const plainProperties = properties.map(p => p.toObject ? p.toObject() : p);
    const propertiesWithCoords = await Promise.all(plainProperties.map(getCoordsForProperty));
    // --- END FIX ---

    res.json(propertiesWithCoords); // Send the updated list

  } catch (error) {
    console.error("Error fetching properties for comparison:", error);
    res.status(500).json({ error: "Failed to retrieve properties for comparison." });
  }
});

app.get('/api/properties/:id/amenities', async (req, res) => {
  try {
    const property = await db.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    const dataForPython = {
      block: property.block,
      street_name: property.street_name
    };

    console.log('[Node.js] Forwarding request for amenities to Python service...');
    // Call our new, dedicated /amenities endpoint in the Python service
    const pythonResponse = await axios.post('http://localhost:5000/amenities', dataForPython);

    res.json(pythonResponse.data);

  } catch (error) {
    console.error('[Node.js] ERROR calling Python service for amenities:', error.message);
    res.status(500).json({ error: 'Failed to get amenity data.' });
  }
});


// The generic route for a single property ID now comes AFTER
app.get('/api/properties/:propertyId', async (req, res) => {
  try {
    // 1. Fetch the Mongoose document as before
    const propertyDoc = await db.getPropertyById(req.params.propertyId);
    if (!propertyDoc) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // 2. Convert the Mongoose document to a plain JavaScript object
    const propertyObject = propertyDoc.toObject();

    // 3. Call the helper function to add coordinates
    //    (This function is already in your index.js file)
    const propertyWithCoords = await getCoordsForProperty(propertyObject);

    // 4. Send the *new* object (which now has coords) to the frontend
    res.json(propertyWithCoords);

  } catch (error) {
    console.error('Error fetching property by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve property data.' });
  }
});

app.get('/api/users/:userId/bookmarks', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookmarks = await db.getBookmarkedProperties(userId);
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bookmarks.' });
  }
});

// Endpoint to add or remove a bookmark for a user
app.post('/api/users/:userId/bookmarks', async (req, res) => {
  try {
    const { userId } = req.params;
    const { propertyId } = req.body;

    // --- ADD THIS CHECK ---
    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'User must be verified to add bookmarks.' });
    }
    // --- END CHECK ---

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required.' });
    }

    // We already fetched the user, so pass it to the db function if needed
    // Or modify toggleBookmark to accept the user object directly
    const updatedBookmarks = await db.toggleBookmark(userId, propertyId);
    res.json({ bookmarks: updatedBookmarks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bookmarks.' });
  }
});

app.put('/api/users/warnings/:warningId/read', async (req, res) => {
  try {
    const { warningId } = req.params;
    const { userId } = req.body; 
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for authorization.'});
    }
    const user = await db.markWarningAsRead(userId, warningId);
    res.json({ warnings: user.warnings });
  } catch (error) {
    console.error("Error marking warning as read:", error);
    let statusCode = 500;
    if (error.message.includes('not found')) {
      statusCode = 404;
    }
    res.status(statusCode).json({ error: error.message || 'Failed to mark warning as read.' });
  }
});

const getCoordsForProperty = async (property) => {
  // --- This check is important ---
  if (!property || !property.block || !property.street_name) {
    console.warn('getCoordsForProperty: Incomplete property data received.');
    return property; 
  }
  
  const searchVal = `${property.block} ${property.street_name}`;
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(searchVal)}&returnGeom=Y&getAddrDetails=Y`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    if (data && data.found > 0 && data.results[0].LATITUDE && data.results[0].LONGITUDE) {
      // Return a plain object with coordinates added
      // If property is a Mongoose doc, convert it
      const plainProp = property.toObject ? property.toObject() : property;
      return {
        ...plainProp, 
        latitude: parseFloat(data.results[0].LATITUDE),
        longitude: parseFloat(data.results[0].LONGITUDE),
      };
    } else {
        console.warn(`Coordinates not found for: ${searchVal}`);
    }
  } catch (error) {
    console.error(`Failed to get coords for ${searchVal}:`, error.message);
  }
  return property.toObject ? property.toObject() : property; 
};


app.post('/api/properties/:id/vote', (req, res) => {
    const { vote } = req.body;
    console.log(`[Node.js] Received vote: ${vote}`);
    res.status(200).json({ message: `Vote '${vote}' received.` });
});


app.post('/api/remarks', async (req, res) => {
    try {
        // --- UPDATED: Destructure communityValuation ---
        const { propertyId, town, userId, text, valuationVote, communityValuation } = req.body;

        const user = await db.User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
        if (user.verificationStatus !== 'verified') {
          return res.status(403).json({ error: 'User must be verified to create remarks.' });
        }
        
        if (!userId || !text || (!propertyId && !town)) {
            return res.status(400).json({ error: "Missing required fields (userId, text, and either propertyId or town)." });
        }

        let remarkTown = town;

        if (propertyId) {
            const property = await db.getPropertyById(propertyId);
            if (!property) {
                return res.status(404).json({ error: 'Property not found.' });
            }
            remarkTown = property.town; 
        }
        
        if (!remarkTown) {
             return res.status(400).json({ error: "Could not determine town for this remark." });
        }
        
        const newRemark = await db.createRemark({
            propertyId: propertyId || null, 
            town: remarkTown,
            userId,
            text,
            valuationVote,
            communityValuation: communityValuation // --- UPDATED: Save the number ---
        });
        
        const populatedRemark = await db.Remark.findById(newRemark._id).populate('userId', 'name _id');
        res.status(201).json(populatedRemark);
        
    } catch (error) {
        console.error("Error creating remark:", error);
        res.status(500).json({ error: "Failed to create remark." });
    }
});

app.get('/api/remarks/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        const remarks = await db.getRemarksForProperty(propertyId);
        res.json(remarks);
    } catch (error) {
        console.error("Error fetching remarks:", error);
        res.status(500).json({ error: "Failed to fetch remarks." });
    }
});

app.get('/api/remarks/average/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.query;

    // --- 1. NEW LOGIC: Only find remarks that ARE valuations ---
    const valuedRemarks = await Remark.find({
      propertyId: parseInt(propertyId),
      status: 'approved',
      // THIS IS THE "BIG PICTURE" FIX:
      // Only find documents where 'communityValuation' exists and is not null.
      communityValuation: { $exists: true, $ne: null }
    });

    let average = null;
    let count = 0;

    if (valuedRemarks && valuedRemarks.length > 0) {
      // Count is now only for actual valuation remarks
      count = valuedRemarks.length;
      
      const sum = valuedRemarks.reduce((acc, remark) => acc + remark.communityValuation, 0);
      average = sum / count;
    }
    // --- END NEW LOGIC ---


    // --- 2. "Has Voted" Check (Now also more specific) ---
    let userHasVoted = false;
    
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userVote = await Remark.findOne({
        propertyId: parseInt(propertyId),
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['pending', 'approved'] },
        // ADD THIS FILTER HERE AS WELL:
        // An "area discussion" comment should not count as a "vote".
        communityValuation: { $exists: true, $ne: null }
      });

      if (userVote) {
        userHasVoted = true;
      }
    }
    
    // --- 3. Send the response ---
    res.json({
      average: average,
      count: count,
      userHasVoted: userHasVoted,
    });

  } catch (error) { 
    console.error('CRITICAL ERROR fetching community average:', error); 
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/remarks/area/:townName', async (req, res) => {
    try {
        const { townName } = req.params;
        const remarks = await db.getRemarksForTown(townName);
        res.json(remarks);
    } catch (error) {
        console.error("Error fetching remarks by town:", error);
        res.status(500).json({ error: "Failed to fetch remarks." });
    }
});

app.delete('/api/remarks/:remarkId/user/:userId', async (req, res) => {
  try {
    const { remarkId, userId } = req.params; // <-- Get both from req.params

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required for authorization.' });
    }

    const result = await db.deleteRemark(remarkId, userId);
    res.json(result); // <-- This will now work and send valid JSON
  } catch (error) {
    console.error("Error deleting remark:", error.message);
     if (error.message.includes('authorized')) {
        res.status(403).json({ error: error.message });
    } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
    } else {
        res.status(500).json({ error: 'Failed to delete remark.' });
    }
  }
});

app.get('/api/admin/remarks', async (req, res) => {
    try {
        const remarks = await db.getPendingRemarks();
        res.json(remarks);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending remarks." });
    }
});

// PUT endpoint for admins to approve or reject a remark
app.put('/api/admin/remarks/:remarkId', async (req, res) => {
    try {
        const { remarkId } = req.params;
        const { status } = req.body; // Expecting 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        const updatedRemark = await db.updateRemarkStatus(remarkId, status);
        res.json(updatedRemark);
    } catch (error) {
        res.status(500).json({ error: "Failed to update remark status." });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

app.put('/api/remarks/:remarkId', async (req, res) => {
  try {
    const { remarkId } = req.params;
    const { newText, userId } = req.body; 

    if (!newText || !userId) {
      return res.status(400).json({ error: 'New text and userId are required.' });
    }

    // This function now returns a { message: '...' } object
    const result = await db.updateRemarkText(remarkId, newText, userId);
    
    // Send the success message from the DB function
    res.json(result); 

  } catch (error) {
    console.error("Error updating remark:", error.message);
    if (error.message.includes('authorized')) {
        res.status(403).json({ error: error.message }); 
    } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message }); 
    } else {
        res.status(500).json({ error: 'Failed to update remark.' });
    }
  }
});

app.get('/api/admin/verifications', async (req, res) => {
  try {
    // Find users with 'pending' status, select necessary fields
    const pendingUsers = await db.User.find({ verificationStatus: { $in: ['pending', 'unverified'] } })
      .select('_id name email verificationRequestedAt verificationDocumentUrl createdAt verificationStatus') // Also select status
      .sort({ verificationRequestedAt: 1 });

    res.json(pendingUsers);

  } catch (err) {
    console.error("Error fetching pending verifications:", err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/admin/rejected-users', async (req, res) => {
  try {
    const rejectedUsers = await db.User.find({ verificationStatus: 'rejected' })
      .select('_id name email createdAt verificationStatus status banDuration') // Must include 'status' and 'banDuration'
      .sort({ updatedAt: -1 }); // Sort by when they were last updated (rejected)

    res.json(rejectedUsers);

  } catch (err) {
    console.error("Error fetching rejected users:", err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/admin/verifications/:userId', async (req, res) => {
  try {
    const { action } = req.body; // Expecting 'approve' or 'reject'
    const { userId } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.verificationStatus !== 'pending' && user.verificationStatus !== 'unverified') {
      return res.status(400).json({ error: 'User does not have a pending or unverified status.' }); // Update error message too
    }
    // Update status based on action
    user.verificationStatus = (action === 'approve') ? 'verified' : 'rejected';
    // Optionally clear request date or document URL on rejection
    // if (action === 'reject') { user.verificationDocumentUrl = null; }

    await user.save();

    // Maybe send a notification/email to the user here? (Future enhancement)

    res.json({ message: `User verification ${action}d successfully.`, userStatus: user.verificationStatus });

  } catch (err) {
    console.error("Error processing verification:", err.message);
    res.status(500).send('Server Error');
  }
});

// PUT endpoint for admins to update a user's status
app.put('/api/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!['active', 'flagged', 'banned'].includes(status)) {
            return res.status(400).json({ error: "Invalid status provided." });
        }

        const updatedUser = await db.updateUserStatus(userId, status);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Failed to update user status." });
    }
});

app.put('/api/admin/users/:userId/ban', async (req, res) => {
  try {
    const { duration } = req.body;
    const { userId } = req.params;

    if (!duration) {
      return res.status(400).json({ error: 'Ban duration is required.' });
    }

    // FIX 2: Use 'db.User' instead of 'User'
    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot ban another admin.' });
    }

    let banExpiresAt = null;
    if (duration !== 'permanent') {
      const now = new Date();
      if (duration === '1-day') {
        banExpiresAt = new Date(now.setDate(now.getDate() + 1));
      } else if (duration === '7-days') {
        banExpiresAt = new Date(now.setDate(now.getDate() + 7));
      } else if (duration === '30-days') {
        banExpiresAt = new Date(now.setDate(now.getDate() + 30));
      }
    }

    user.status = 'banned';
    user.banDuration = duration;
    user.banExpiresAt = banExpiresAt;

    await user.save();
    
    // Return the updated user (just like your handleUpdateUserStatus endpoint)
    res.json(user); 

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/admin/users/:userId/flag', async (req, res) => {
  try {
    const { reason } = req.body; // The warning message
    const { userId } = req.params;

    if (!reason) {
      return res.status(400).json({ error: 'A reason (warning message) is required.' });
    }

    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot flag another admin.' });
    }

    // --- NEW "TWO-STRIKE" LOGIC ---
    if (user.status === 'flagged') {
      // This is the second strike. Ban them for 7 days.
      const now = new Date();
      user.status = 'banned';
      user.banDuration = '7-days';
      user.banExpiresAt = new Date(now.setDate(now.getDate() + 7));
      user.warnings.push({ message: `BANNED: ${reason}` }); // Add the reason for the ban
      await user.save();
      
      // Send back the updated user and a specific message
      res.json({ 
        message: 'User was already flagged, and has now been banned for 7 days.',
        user: user 
      });

    } else {
      // This is the first strike. Just flag them.
      user.status = 'flagged';
      user.warnings.push({ message: reason });
      await user.save();

      // Send back the updated user and a message
      res.json({ 
        message: 'User has been flagged and warned.',
        user: user 
      });
    }
    // --- END NEW LOGIC ---

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- SERVER STARTUP ---
app.listen(PORT, () => {
  console.log(`[Node.js] Backend server is running on http://localhost:${PORT}`);
});
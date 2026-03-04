// ResaleSense-Backend/data/MongoDBImpl.js

const User = require('../models/user.model');
const Property = require('../models/property.model');
const Remark = require('../models/remark.model');
const SupportMessage = require('../models/supportMessage.model');
const Notification = require('../models/notification.model');

class MongoDBImpl {
  constructor() {
    this.User = User;
    this.Property = Property;
    this.Remark = Remark;
    this.SupportMessage = SupportMessage;
    this.Notification = Notification;
  }

  // --- User Methods ---
  async findUserByEmail(email) {
    return await this.User.findOne({ email });
  }
  async createUser(userData) {
    const newUser = new this.User(userData);
    return await newUser.save();
  }
  async toggleBookmark(userId, propertyId) {
    const user = await this.User.findById(userId);
    if (!user) { throw new Error('User not found'); }
    const propertyIdAsNumber = Number(propertyId);
    const bookmarkIndex = user.bookmarks.indexOf(propertyIdAsNumber);
    if (bookmarkIndex > -1) { user.bookmarks.splice(bookmarkIndex, 1); }
    else { user.bookmarks.push(propertyIdAsNumber); }
    await user.save();
    return user.bookmarks;
  }
  async createSupportMessage(messageData) {
    const newMessage = new this.SupportMessage(messageData);
    return await newMessage.save();
  }
  async getBookmarkedProperties(userId) {
    const user = await this.User.findById(userId).populate('bookmarks');
    if (!user) { throw new Error('User not found'); }
    return user.bookmarks;
  }
  async getSupportMessagesForUser(userId) {
    return await this.SupportMessage.find({ userId: userId })
                           .populate('adminId', 'name') 
                           .sort({ createdAt: 1 }); 
  }
  
  async markUserMessagesAsReadByAdmin(userId) {
    return await this.SupportMessage.updateMany(
      { userId: userId, senderType: 'User', isReadByAdmin: false },
      { $set: { isReadByAdmin: true } }
    );
  }

  async getUsersWithReadMessages() {
    // 1. Find all user IDs that have at least ONE unread message
    const usersWithUnread = await this.SupportMessage.distinct('userId', {
      isReadByAdmin: false,
      senderType: 'User'
    });

    // 2. Find all user IDs that have ANY messages
    const allUsersWithMessages = await this.SupportMessage.distinct('userId');

    // 3. Find users who are in 'allUsersWithMessages' but NOT in 'usersWithUnread'
    const readUserIds = allUsersWithMessages.filter(
      (userId) => !usersWithUnread.some(unreadId => unreadId.equals(userId))
    );

    // 4. Get the user details for these "read" users
    return await this.User.find({
      '_id': { $in: readUserIds }
    }).select('_id name email').sort({ name: 1 });
  }

  async markWarningAsRead(userId, warningId) {
    const user = await this.User.findById(userId);
    if (!user) { throw new Error('User not found.'); }
    const warning = user.warnings.id(warningId);
    if (!warning) { throw new Error('Warning not found.'); }
    warning.read = true;
    await user.save();
    return user;
  }
  
  // ... (All Property, Remark, and Admin methods are unchanged) ...
  // ... (All Notification methods are unchanged) ...
  // --- Property Methods ---
  async getProperties(filter = {}, limit) {
    let query = this.Property.find(filter).sort({ month: -1 }); 
    if (limit) { query = query.limit(limit); }
    return await query;
  }
  async getPropertyById(id) {
    return await this.Property.findById(id);
  }
  async getPropertiesByIds(ids) {
    const numericIds = ids.map(id => Number(id));
    return await this.Property.find({ _id: { $in: numericIds } });
  }
  async getPropertyStats() {
    const priceStatsAgg = await this.Property.aggregate([
      { $group: { _id: null, price_min: { $min: "$resale_price" }, price_max: { $max: "$resale_price" }, } }
    ]);
    const priceStats = priceStatsAgg[0] || { price_min: 0, price_max: 0 };
    const distinctAreas = await this.Property.distinct('floor_area_sqm');
    distinctAreas.sort((a, b) => a - b);
    const area_min = distinctAreas.length > 1 ? distinctAreas[1] : (distinctAreas[0] || 0);
    const area_max = distinctAreas.length > 1 ? distinctAreas[distinctAreas.length - 2] : (distinctAreas[distinctAreas.length - 1] || 0);
    return {
      price_min: priceStats.price_min,
      price_max: priceStats.price_max,
      area_min: area_min,
      area_max: area_max, 
    };
  }
  async getTownAveragePrices() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await this.Property.aggregate([
      { $addFields: { saleDate: { $toDate: "$month" } } },
      { $match: { saleDate: { $gte: oneYearAgo } } },
      { $group: { _id: "$town", averagePrice: { $avg: "$resale_price" } } },
      { $sort: { _id: 1 } }
    ]);
  }
  async getDistinctFieldValues(field) {
    return await this.Property.distinct(field);
  }
  async filterProperties(filters, page = 1, limit = 50) {
    const query = {};
    if (filters.town) { query.town = new RegExp(filters.town, 'i'); }
    if (filters.flat_type) { query.flat_type = filters.flat_type; }
    if (filters.price_min || filters.price_max) {
        query.resale_price = {};
        if (filters.price_min) { query.resale_price.$gte = parseInt(filters.price_min, 10); }
        if (filters.price_max) { query.resale_price.$lte = parseInt(filters.price_max, 10); }
    }
    if (filters.area_min || filters.area_max) {
        query.floor_area_sqm = {};
        if (filters.area_min) { query.floor_area_sqm.$gte = parseInt(filters.area_min, 10); }
        if (filters.area_max) { query.floor_area_sqm.$lte = parseInt(filters.area_max, 10); }
    }
    if (filters.storey_min || filters.storey_max) {
        const min = filters.storey_min || 1;
        const max = filters.storey_max || 55;
        const levels = Array.from({ length: max - min + 1 }, (_, i) => String(min + i).padStart(2, '0'));
        const regex = new RegExp(`^(${levels.join('|')}) TO`);
        query.storey_range = regex;
    }
    if (filters.flat_model) {
        query.flat_model = filters.flat_model;
    }
    if (filters.min_lease) {
        const minLease = parseInt(filters.min_lease, 10);
        if (!isNaN(minLease) && minLease > 0) {
            const currentYear = new Date().getFullYear();
            const targetCommenceDate = currentYear - (99 - minLease);
            query.lease_commence_date = { $gte: targetCommenceDate };
        }
    }
    const skipAmount = (page - 1) * limit;
    const totalCountPromise = this.Property.countDocuments(query);
    const propertiesPromise = this.Property.find(query)
                               .sort({ month: -1 })
                               .skip(skipAmount)
                               .limit(limit);
    const [totalCount, properties] = await Promise.all([totalCountPromise, propertiesPromise]);
    return { properties, totalCount };
  }

  // --- Remark Methods ---
  async createRemark(remarkData) {
    const newRemark = new this.Remark(remarkData);
    return await newRemark.save();
  }
  async getRemarksForProperty(propertyId) {
    return await this.Remark.find({ propertyId, status: 'approved' })
                           .populate('userId', 'name _id')
                           .select('-status')
                           .sort({ createdAt: -1 });
  }
  async getCommunityValuationAverage(propertyId) {
    const propertyIdAsNumber = Number(propertyId);
    const result = await this.Remark.aggregate([
      { $match: { propertyId: propertyIdAsNumber, status: 'approved', communityValuation: { $exists: true, $ne: null } } },
      { $group: { _id: "$propertyId", average: { $avg: "$communityValuation" } } }
    ]);
    return result[0] || null;
  }
  async updateRemarkText(remarkId, newText, userId) {
    const remark = await this.Remark.findById(remarkId);
    if (!remark) { throw new Error('Remark not found.'); }
    if (remark.userId.toString() !== userId) { throw new Error('User not authorized to edit this remark.'); }
    remark.text = newText;
    remark.status = 'pending'; 
    remark.isEdited = true;   
    await remark.save();
    return { message: 'Edit submitted successfully for re-approval.' };
  }
  async getRemarksForTown(townName) {
    return await this.Remark.find({ 
        town: new RegExp(townName, 'i'), 
        propertyId: null, 
        status: 'approved' 
      })
      .populate('userId', 'name _id')
      .select('-status')
      .sort({ createdAt: -1 });
  }
  async deleteRemark(remarkId, userId) {
    const remark = await this.Remark.findById(remarkId);
    if (!remark) { throw new Error('Remark not found.'); }
    if (remark.userId.toString() !== userId) { throw new Error('User not authorized to delete this remark.'); }
    await this.Remark.findByIdAndDelete(remarkId);
    return { message: 'Remark deleted successfully.' };
  }

  // --- Admin Methods ---
  async getPendingRemarks() {
    return await this.Remark.find({ status: 'pending' })
                            .populate('userId', 'name')
                            .populate({
                              path: 'propertyId',
                              select: '_id resale_price block street_name'
                            })
                            .select('-password')
                            .sort({ createdAt: 1 });
  }
  async updateRemarkStatus(remarkId, newStatus) {
    return await this.Remark.findByIdAndUpdate(remarkId, { status: newStatus }, { new: true });
  }
  async getAllUsers() {
    return await this.User.find().select('-password').sort({ createdAt: -1 });
  }
  async updateUserStatus(userId, newStatus) {
    return await this.User.findByIdAndUpdate(userId, { status: newStatus }, { new: true }).select('-password');
  }

  // --- Notification Methods ---
  async createNotification(notificationData) {
    const newNotification = new this.Notification(notificationData);
    return await newNotification.save();
  }
  async getNotificationsForUser(userId) {
    return await this.Notification.find({ userId: userId })
                                 .sort({ createdAt: -1 });
  }
  async getUnreadNotificationCount(userId) {
    return await this.Notification.countDocuments({ 
      userId: userId, 
      isRead: false 
    });
  }
  async markNotificationAsRead(notificationId, userId) {
    const notification = await this.Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      throw new Error('Notification not found or user unauthorized.');
    }
    return notification;
  }
  async markAllNotificationsAsRead(userId) {
    return await this.Notification.updateMany(
      { userId: userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = MongoDBImpl;
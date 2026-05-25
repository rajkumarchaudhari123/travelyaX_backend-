'use strict';

const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io;

// Map to store connected users and their roles/socket IDs
const connectedUsers = new Map();

// Map userId → socketId for quick lookup
const userSocketMap = new Map();

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // When a user authenticates, they should emit an 'authenticate' event
    socket.on('authenticate', (data) => {
      const { userId, role } = data;
      
      connectedUsers.set(socket.id, {
        userId,
        role, // 'rider', 'driver'
        socketId: socket.id
      });

      // Map userId to socketId for direct messaging
      userSocketMap.set(String(userId), socket.id);
      
      logger.info(`User authenticated on socket: ${socket.id}, UserID: ${userId}, Role: ${role}`);
      
      // If the user is a driver, join the 'drivers' room
      if (role === 'driver') {
        socket.join('drivers');
        logger.info(`Driver ${userId} joined drivers room`);
      }

      // Join a user-specific room for targeted notifications
      socket.join(`user_${userId}`);
    });

    // Driver location updates (for future real-time tracking)
    socket.on('driver_location_update', (data) => {
      const user = connectedUsers.get(socket.id);
      if (user && user.role === 'driver') {
        // Broadcast to rider if this driver has an active ride
        if (data.rideId) {
          io.to(`ride_${data.rideId}`).emit('driver_location', {
            driverId: user.userId,
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading,
          });
        }
      }
    });

    // Join ride-specific room (for both rider and driver)
    socket.on('join_ride', (data) => {
      const { rideId } = data;
      socket.join(`ride_${rideId}`);
      logger.info(`Socket ${socket.id} joined ride_${rideId}`);
    });

    // Real-time Chat
    socket.on('send_chat_message', (data) => {
      const { receiverId, message, rideId } = data;
      const user = connectedUsers.get(socket.id);
      if (user && receiverId) {
        logger.info(`Chat message from ${user.userId} to ${receiverId}`);
        io.to(`user_${receiverId}`).emit('receive_chat_message', {
          senderId: user.userId,
          rideId,
          message,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        userSocketMap.delete(String(user.userId));
      }
      logger.info(`Socket disconnected: ${socket.id}`);
      connectedUsers.delete(socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Emits an event to all connected drivers
const notifyDrivers = (event, data) => {
  if (io) {
    io.to('drivers').emit(event, data);
    logger.info(`📡 Notified all drivers: ${event}`);
  }
};

// Notify a specific user by userId
const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
    logger.info(`📡 Notified user ${userId}: ${event}`);
  }
};

// Get count of online drivers
const getOnlineDriverCount = () => {
  let count = 0;
  connectedUsers.forEach((user) => {
    if (user.role === 'driver') count++;
  });
  return count;
};

module.exports = {
  initSocket,
  getIo,
  notifyDrivers,
  notifyUser,
  getOnlineDriverCount,
  connectedUsers,
  userSocketMap,
};

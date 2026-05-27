'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Password@123', saltRounds);
    const now = new Date();

    // ─── 1. Users ──────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('users', [
      {
        fullName: 'Admin User',
        phone: '+10000000001',
        email: 'admin@travelya.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Alice Rider',
        phone: '+10000000002',
        email: 'alice@travelya.com',
        password: hashedPassword,
        role: 'rider',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Bob Rider',
        phone: '+10000000003',
        email: 'bob@travelya.com',
        password: hashedPassword,
        role: 'rider',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Carlos Driver',
        phone: '+10000000004',
        email: 'carlos@travelya.com',
        password: hashedPassword,
        role: 'driver',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Diana Driver',
        phone: '+10000000005',
        email: 'diana@travelya.com',
        password: hashedPassword,
        role: 'driver',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // ─── 2. Driver Profiles ────────────────────────────────────────────────────
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users ORDER BY id ASC`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const userMap = Object.fromEntries(users.map((u) => [u.email, u.id]));

    await queryInterface.bulkInsert('drivers', [
      {
        userId:        userMap['carlos@travelya.com'],
        licenseNumber: 'DL-CA-001234',
        vehicleType:   'Sedan',
        vehicleNumber: 'CA-123-TRVL',
        vehicleModel:  'Toyota Camry 2022',
        vehicleColor:  'Black',
        vehicleYear:   2022,
        status:        'approved',
        isOnline:      true,
        rating:        4.85,
        totalTrips:    142,
        totalEarnings: 2840.50,
        approvedAt:    now,
        createdAt:     now,
        updatedAt:     now,
      },
      {
        userId:        userMap['diana@travelya.com'],
        licenseNumber: 'DL-CA-005678',
        vehicleType:   'SUV',
        vehicleNumber: 'CA-456-TRVL',
        vehicleModel:  'Honda CR-V 2023',
        vehicleColor:  'White',
        vehicleYear:   2023,
        status:        'approved',
        isOnline:      false,
        rating:        4.92,
        totalTrips:    98,
        totalEarnings: 2150.00,
        approvedAt:    now,
        createdAt:     now,
        updatedAt:     now,
      },
    ]);

    // ─── 3. Wallets ────────────────────────────────────────────────────────────
    const walletUsers = [
      userMap['alice@travelya.com'],
      userMap['bob@travelya.com'],
      userMap['carlos@travelya.com'],
      userMap['diana@travelya.com'],
      userMap['admin@travelya.com'],
    ];
    const balances = [150.00, 75.50, 320.00, 220.00, 500.00];

    await queryInterface.bulkInsert('wallets', walletUsers.map((userId, i) => ({
      userId,
      balance:      balances[i],
      currency:     'USD',
      totalCredits: balances[i] + 50,
      totalDebits:  50.00,
      isActive:     true,
      createdAt:    now,
      updatedAt:    now,
    })));

    // ─── 4. Buses ──────────────────────────────────────────────────────────────
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dep1 = new Date(tomorrow); dep1.setHours(8, 0, 0);
    const arr1 = new Date(tomorrow); arr1.setHours(14, 0, 0);
    const dep2 = new Date(tomorrow); dep2.setHours(20, 0, 0);
    const arr2 = new Date(dayAfter); arr2.setHours(6, 0, 0);
    const dep3 = new Date(tomorrow); dep3.setHours(7, 30, 0);
    const arr3 = new Date(tomorrow); arr3.setHours(11, 30, 0);

    await queryInterface.bulkInsert('buses', [
      {
        name: 'Travelya Express',
        busNumber: 'TRV-001',
        operatorName: 'Travelya Bus Lines',
        source: 'New York',
        destination: 'Boston',
        departureTime: dep1,
        arrivalTime: arr1,
        price: 45.00,
        totalSeats: 40,
        bookedSeats: 12,
        busType: 'AC',
        rating: 4.5,
        amenities: JSON.stringify(['WiFi', 'AC', 'USB Charging', 'Snacks']),
        boardingPoints: JSON.stringify(['Manhattan Terminal', 'JFK Bus Stop']),
        droppingPoints: JSON.stringify(['South Station', 'Logan Airport']),
        isActive: true,
        travelDate: tomorrow.toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'NightOwl Sleeper',
        busNumber: 'TRV-002',
        operatorName: 'NightOwl Travels',
        source: 'New York',
        destination: 'Washington DC',
        departureTime: dep2,
        arrivalTime: arr2,
        price: 65.00,
        totalSeats: 30,
        bookedSeats: 5,
        busType: 'Sleeper',
        rating: 4.7,
        amenities: JSON.stringify(['WiFi', 'AC', 'Blanket', 'Pillow', 'USB Charging']),
        boardingPoints: JSON.stringify(['Penn Station']),
        droppingPoints: JSON.stringify(['Union Station DC']),
        isActive: true,
        travelDate: tomorrow.toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Volvo Luxe',
        busNumber: 'TRV-003',
        operatorName: 'Luxe Bus Co',
        source: 'Boston',
        destination: 'New York',
        departureTime: dep3,
        arrivalTime: arr3,
        price: 55.00,
        totalSeats: 44,
        bookedSeats: 20,
        busType: 'Volvo',
        rating: 4.8,
        amenities: JSON.stringify(['WiFi', 'AC', 'Entertainment Screen', 'USB Charging', 'Meals']),
        boardingPoints: JSON.stringify(['South Station']),
        droppingPoints: JSON.stringify(['Port Authority']),
        isActive: true,
        travelDate: tomorrow.toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // ─── 5. Hotels ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('hotels', [
      {
        name: 'The Grand Travelya',
        description: 'A luxury 5-star experience in the heart of the city with world-class amenities.',
        location: '100 Park Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        pricePerNight: 299.00,
        category: 'luxury',
        rating: 4.9,
        reviewCount: 1240,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        contactPhone: '+12125550100',
        contactEmail: 'reservations@grandtravelya.com',
        amenities: JSON.stringify(['Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Valet Parking', 'WiFi', 'Concierge']),
        roomTypes: JSON.stringify([
          { type: 'Deluxe', price: 299 },
          { type: 'Suite', price: 499 },
          { type: 'Presidential Suite', price: 999 },
        ]),
        isAvailable: true,
        totalRooms: 200,
        isActive: true,
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Comfort Stay Inn',
        description: 'Affordable, clean, and conveniently located near major transit hubs.',
        location: '45 West 35th Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        pricePerNight: 89.00,
        category: 'budget',
        rating: 3.8,
        reviewCount: 520,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        contactPhone: '+12125550200',
        contactEmail: 'stay@comfortinn.com',
        amenities: JSON.stringify(['WiFi', 'AC', 'TV', '24/7 Reception']),
        roomTypes: JSON.stringify([
          { type: 'Standard', price: 89 },
          { type: 'Double', price: 109 },
        ]),
        isAvailable: true,
        totalRooms: 80,
        isActive: true,
        cancellationPolicy: 'Cancellation allowed up to 48 hours before check-in for a full refund.',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Harbor View Deluxe',
        description: 'Stunning harbor views with premium amenities in a prime waterfront location.',
        location: '22 Harbor Drive',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        pricePerNight: 185.00,
        category: 'deluxe',
        rating: 4.5,
        reviewCount: 780,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        contactPhone: '+16175550300',
        contactEmail: 'info@harborviewdeluxe.com',
        amenities: JSON.stringify(['Pool', 'Gym', 'Restaurant', 'Bar', 'WiFi', 'Room Service', 'Business Center']),
        roomTypes: JSON.stringify([
          { type: 'Standard', price: 185 },
          { type: 'Harbor View', price: 225 },
          { type: 'Penthouse', price: 450 },
        ]),
        isAvailable: true,
        totalRooms: 120,
        isActive: true,
        cancellationPolicy: 'Free cancellation up to 72 hours before check-in.',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Central Standard Hotel',
        description: 'Modern standard hotel offering great value with easy access to downtown.',
        location: '88 K Street NW',
        city: 'Washington DC',
        state: 'DC',
        country: 'USA',
        pricePerNight: 130.00,
        category: 'standard',
        rating: 4.2,
        reviewCount: 630,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        contactPhone: '+12025550400',
        contactEmail: 'info@centralstandard.com',
        amenities: JSON.stringify(['WiFi', 'AC', 'Gym', 'Business Center', 'Restaurant', 'Parking']),
        roomTypes: JSON.stringify([
          { type: 'Standard', price: 130 },
          { type: 'Superior', price: 160 },
        ]),
        isAvailable: true,
        totalRooms: 150,
        isActive: true,
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // ─── 6. Sample Transactions ────────────────────────────────────────────────
    const isPostgres = queryInterface.sequelize.options.dialect === 'postgres';
    const wallets = await queryInterface.sequelize.query(
      isPostgres ? 'SELECT id, "userId" FROM wallets' : 'SELECT id, userId FROM wallets',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const walletByUser = Object.fromEntries(wallets.map((w) => [w.userId || w.userid, w.id]));

    const aliceId = userMap['alice@travelya.com'];
    const carlosId = userMap['carlos@travelya.com'];

    if (walletByUser[aliceId]) {
      await queryInterface.bulkInsert('transactions', [
        {
          userId:        aliceId,
          walletId:      walletByUser[aliceId],
          type:          'credit',
          amount:        200.00,
          balanceBefore: 0.00,
          balanceAfter:  200.00,
          currency:      'USD',
          category:      'wallet_topup',
          description:   'Initial wallet top-up via card',
          status:        'success',
          createdAt:     now,
        },
        {
          userId:        aliceId,
          walletId:      walletByUser[aliceId],
          type:          'debit',
          amount:        50.00,
          balanceBefore: 200.00,
          balanceAfter:  150.00,
          currency:      'USD',
          category:      'ride_payment',
          description:   'Ride payment — Downtown to Airport',
          reference:     '1',
          referenceType: 'ride',
          status:        'success',
          createdAt:     now,
        },
      ]);
    }

    if (walletByUser[carlosId]) {
      await queryInterface.bulkInsert('transactions', [
        {
          userId:        carlosId,
          walletId:      walletByUser[carlosId],
          type:          'credit',
          amount:        320.00,
          balanceBefore: 0.00,
          balanceAfter:  320.00,
          currency:      'USD',
          category:      'driver_earning',
          description:   'Driver earnings — weekly payout',
          status:        'success',
          createdAt:     now,
        },
      ]);
    }

    // ─── 7. Welcome Notifications ──────────────────────────────────────────────
    const notifUsers = [
      { id: userMap['alice@travelya.com'],  name: 'Alice' },
      { id: userMap['bob@travelya.com'],    name: 'Bob' },
      { id: userMap['carlos@travelya.com'], name: 'Carlos' },
      { id: userMap['diana@travelya.com'],  name: 'Diana' },
    ];

    await queryInterface.bulkInsert('notifications', [
      ...notifUsers.map((u) => ({
        userId:    u.id,
        title:     `Welcome to Travelya, ${u.name}! 🎉`,
        message:   'Your account is set up. Start booking rides, buses, and hotels today.',
        type:      'system',
        isRead:    false,
        createdAt: now,
      })),
      {
        userId:  userMap['alice@travelya.com'],
        title:   '🎁 First Ride Discount',
        message: 'Use code TRAVEL30 for 30% off your first ride booking!',
        type:    'promo',
        isRead:  false,
        createdAt: now,
      },
      {
        userId:  userMap['carlos@travelya.com'],
        title:   '✅ Driver Account Approved',
        message: 'Your driver profile has been verified. Go online to start accepting rides!',
        type:    'system',
        isRead:  false,
        createdAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('wallets', null, {});
    await queryInterface.bulkDelete('hotels', null, {});
    await queryInterface.bulkDelete('buses', null, {});
    await queryInterface.bulkDelete('drivers', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};

'use strict';

require('dotenv').config();
const { connectDB, sequelize } = require('../src/config/db');
const { User, Driver } = require('../src/models');

const check = async () => {
  try {
    await connectDB();
    
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'isActive']
    });
    
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
    
    const drivers = await Driver.findAll();
    console.log('\n--- DRIVERS IN DATABASE ---');
    console.log(JSON.stringify(drivers, null, 2));
    
    await sequelize.close();
  } catch (err) {
    console.error('Error querying database:', err);
  }
};

check();

require('dotenv').config();
const { sequelize } = require('./src/config/db');
const { User } = require('./src/models');

async function test() {
  try {
    await sequelize.authenticate();
    const user = await User.scope('withPassword').findOne();
    console.log("User via scope('withPassword'):", user ? user.toJSON() : 'No user found');
    
    const userUnscoped = await User.unscoped().findOne();
    console.log("User via unscoped():", userUnscoped ? userUnscoped.toJSON() : 'No user found');
    
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();

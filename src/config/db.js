'use strict';

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Auto-detect production databases (e.g. Railway, Heroku)
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let sequelize;

if (dbUrl) {
  logger.info('🔌 Connecting via database connection URL string');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => logger.debug(msg)
      : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: false,
      freezeTableName: false,
      timestamps: true,
    },
    timezone: '+00:00',
  });
} else {
  // Extract individual fields, mapping Railway individual parameters if available
  const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE;
  const dbUser = process.env.DB_USER || process.env.MYSQLUSER;
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);

  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => logger.debug(msg)
      : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: false,
      freezeTableName: false,
      timestamps: true,
    },
    timezone: '+00:00',
  });
}

/**
 * Test the database connection
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅  MySQL connected via Sequelize');

    if (process.env.NODE_ENV === 'development') {
      // Sync without altering in production — use migrations instead
      // Changed to normal sync to prevent database constraint locks & transaction deadlocks on nodemon restart
      await sequelize.sync();
      logger.info('✅  Sequelize models synced');
    }
  } catch (error) {
    logger.error(`❌  Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

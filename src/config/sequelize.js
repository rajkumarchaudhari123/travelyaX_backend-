'use strict';

require('dotenv').config();

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let isPostgres = false;
if (dbUrl) {
  isPostgres = dbUrl.startsWith('postgres');
}

const config = dbUrl ? {
  use_env_variable: process.env.MYSQL_URL ? 'MYSQL_URL' : 'DATABASE_URL',
  dialect: isPostgres ? 'postgres' : 'mysql',
  dialectOptions: isPostgres ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : undefined,
  logging: false,
} : {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'travelya_db',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: config,
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: `${process.env.DB_NAME || 'travelya_db'}_test`,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
  },
  production: dbUrl ? {
    use_env_variable: process.env.MYSQL_URL ? 'MYSQL_URL' : 'DATABASE_URL',
    dialect: isPostgres ? 'postgres' : 'mysql',
    dialectOptions: isPostgres ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : undefined,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  } : {
    username: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
};

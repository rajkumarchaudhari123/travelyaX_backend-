'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

class User extends Model {
  // ─── Instance Methods ──────────────────────────────────────────────────────

  /** Compare plain password against stored hash */
  async comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  }

  /** Return safe user object (no password) */
  toSafeObject() {
    const { password, ...safe } = this.toJSON();
    return safe;
  }

  /** Check if user has a given role */
  hasRole(role) {
    return this.role === role;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name cannot be empty' },
        len: { args: [2, 100], msg: 'Full name must be 2–100 characters' },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { name: 'users_phone_unique', msg: 'Phone number already registered' },
      validate: {
        notEmpty: { msg: 'Phone number cannot be empty' },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { name: 'users_email_unique', msg: 'Email address already registered' },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password cannot be empty' },
      },
    },
    role: {
      type: DataTypes.ENUM('rider', 'driver', 'admin'),
      allowNull: false,
      defaultValue: 'rider',
      validate: {
        isIn: { args: [['rider', 'driver', 'admin']], msg: 'Invalid role' },
      },
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: false, // set true to enable soft deletes
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] },
      { fields: ['role'] },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['password', 'refreshToken'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
      withRefreshToken: {
        attributes: { include: ['refreshToken'] },
      },
      active: {
        where: { isActive: true },
      },
    },
  }
);

module.exports = User;

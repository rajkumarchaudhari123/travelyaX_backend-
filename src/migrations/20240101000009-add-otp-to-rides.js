'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rides', 'otp', {
      type: Sequelize.STRING(4),
      allowNull: true,
      defaultValue: null,
      comment: '4-digit OTP for ride verification',
    });

    await queryInterface.addColumn('rides', 'otpVerifiedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when OTP was verified by driver',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('rides', 'otpVerifiedAt');
    await queryInterface.removeColumn('rides', 'otp');
  },
};

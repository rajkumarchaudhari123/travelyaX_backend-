# 🚀 Travelya Backend API

Production-grade Node.js + Express + MySQL backend for the Travelya super travel app.

---

## 🧱 Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Runtime       | Node.js 18+ LTS                     |
| Framework     | Express.js 4.x                      |
| Database      | MySQL 8.x                           |
| ORM           | Sequelize 6 + sequelize-cli         |
| Auth          | JWT (access + refresh tokens)       |
| Passwords     | bcryptjs (12 salt rounds)           |
| Validation    | Joi                                 |
| File Uploads  | Multer                              |
| Security      | Helmet, express-rate-limit, CORS    |
| Logging       | Custom structured logger            |
| Architecture  | MVC (Models → Services → Controllers → Routes) |

---

## 📁 Project Structure

```
travelya-backend/
├── server.js                    # Entry point — Express app + bootstrap
├── .env.example                 # Environment variable template
├── .sequelizerc                 # Sequelize CLI path config
├── uploads/                     # Uploaded driver documents
└── src/
    ├── config/
    │   ├── db.js                # Sequelize instance + connectDB()
    │   ├── sequelize.js         # Sequelize CLI config (dev/test/prod)
    │   └── multer.js            # File upload configuration
    ├── models/
    │   ├── index.js             # Model registry + all associations
    │   ├── User.js
    │   ├── Driver.js
    │   ├── DriverDocument.js
    │   ├── Ride.js
    │   ├── Bus.js
    │   ├── BusBooking.js
    │   ├── Hotel.js
    │   ├── HotelBooking.js
    │   ├── Wallet.js
    │   ├── Transaction.js
    │   └── Notification.js
    ├── migrations/              # Sequelize migration files
    ├── seeders/                 # Demo seed data
    ├── controllers/             # HTTP layer (thin — delegates to services)
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── ride.controller.js
    │   ├── bus.controller.js
    │   ├── hotel.controller.js
    │   ├── wallet.controller.js
    │   ├── notification.controller.js
    │   └── upload.controller.js
    ├── services/                # Business logic layer
    │   ├── auth.service.js
    │   ├── user.service.js
    │   ├── ride.service.js
    │   ├── bus.service.js
    │   ├── hotel.service.js
    │   ├── wallet.service.js
    │   └── notification.service.js
    ├── routes/
    │   ├── index.js             # Central route registry
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── ride.routes.js
    │   ├── bus.routes.js
    │   ├── hotel.routes.js
    │   ├── wallet.routes.js
    │   ├── transaction.routes.js
    │   ├── notification.routes.js
    │   └── upload.routes.js
    ├── middlewares/
    │   ├── auth.middleware.js       # JWT verify + role guards
    │   ├── error.middleware.js      # Global error handler
    │   ├── validate.middleware.js   # Joi schema middleware factory
    │   └── rateLimiter.middleware.js
    └── utils/
        ├── AppError.js             # Custom error class + factory methods
        ├── response.js             # Standardized API response helpers
        ├── jwt.js                  # Token sign/verify utilities
        ├── validators.js           # All Joi schemas
        └── logger.js               # Structured console logger
```

---

## ⚙️ Setup & Installation

### 1. Clone and install
```bash
cd travelya-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and secrets
```

### 3. Create MySQL database
```sql
CREATE DATABASE travelya_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations
```bash
npm run db:migrate
```

### 5. Seed demo data
```bash
npm run db:seed
```

### 6. Start development server
```bash
npm run dev
# Server starts at http://localhost:5000
```

---

## 🌐 API Reference

### Base URL
```
http://localhost:5000/api
```

### Standard Response Format
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... },
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

---

## 🔐 Authentication

### Register Rider
```
POST /api/auth/register-rider
Content-Type: application/json

{
  "fullName": "Alice Rider",
  "phone": "+1234567890",
  "email": "alice@example.com",
  "password": "Password@123"
}
```

### Register Driver
```
POST /api/auth/register-driver
Content-Type: application/json

{
  "fullName": "Carlos Driver",
  "phone": "+0987654321",
  "email": "carlos@example.com",
  "password": "Password@123",
  "licenseNumber": "DL-CA-001234",
  "vehicleType": "Sedan",
  "vehicleNumber": "CA-001-TRV",
  "vehicleModel": "Toyota Camry 2022"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "Password@123"
}

Response:
{
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "role": "rider",
    "userId": 2,
    "user": { ... }
  }
}
```

### Using the token
```
Authorization: Bearer <accessToken>
```

---

## 📋 All Endpoints

### Auth
| Method | Endpoint                      | Auth | Description             |
|--------|-------------------------------|------|-------------------------|
| POST   | /auth/register-rider          | No   | Register new rider      |
| POST   | /auth/register-driver         | No   | Register new driver     |
| POST   | /auth/login                   | No   | Login                   |
| POST   | /auth/refresh-token           | No   | Refresh access token    |
| POST   | /auth/logout                  | Yes  | Logout                  |
| POST   | /auth/change-password         | Yes  | Change password         |
| GET    | /auth/me                      | Yes  | Get current user        |

### Users
| Method | Endpoint                            | Role   | Description              |
|--------|-------------------------------------|--------|--------------------------|
| GET    | /users/profile                      | Any    | Get own profile          |
| PUT    | /users/profile                      | Any    | Update profile           |
| POST   | /users/avatar                       | Any    | Upload avatar            |
| PATCH  | /users/driver/online-status         | Driver | Toggle online/offline    |
| DELETE | /users/account                      | Any    | Deactivate account       |
| GET    | /users/admin/users                  | Admin  | List all users           |
| PATCH  | /users/admin/drivers/:id/review     | Admin  | Approve/reject driver    |

### Rides
| Method | Endpoint                  | Role          | Description           |
|--------|---------------------------|---------------|-----------------------|
| POST   | /rides/book               | Rider         | Book a new ride       |
| POST   | /rides/accept             | Driver        | Accept a ride request |
| POST   | /rides/:rideId/start      | Driver        | Start ride            |
| POST   | /rides/:rideId/complete   | Driver        | Complete ride         |
| POST   | /rides/cancel             | Rider/Driver  | Cancel a ride         |
| GET    | /rides                    | Any           | List rides (by role)  |
| GET    | /rides/:rideId            | Any           | Get single ride       |
| POST   | /rides/:rideId/rate       | Any           | Rate a ride           |

### Buses
| Method | Endpoint                           | Role  | Description             |
|--------|------------------------------------|-------|-------------------------|
| GET    | /buses                             | Any   | Search buses            |
| GET    | /buses/:busId                      | Any   | Get bus details         |
| POST   | /buses/book                        | Rider | Book seats              |
| GET    | /buses/bookings/my                 | Any   | My bus bookings         |
| GET    | /buses/bookings/:bookingId         | Any   | Get booking details     |
| POST   | /buses/bookings/:bookingId/cancel  | Rider | Cancel booking          |

### Hotels
| Method | Endpoint                             | Role  | Description           |
|--------|--------------------------------------|-------|-----------------------|
| GET    | /hotels                              | Any   | Search hotels         |
| GET    | /hotels/:hotelId                     | Any   | Get hotel details     |
| POST   | /hotels/book                         | Rider | Book a hotel          |
| GET    | /hotels/bookings/my                  | Any   | My hotel bookings     |
| GET    | /hotels/bookings/:bookingId          | Any   | Get booking details   |
| POST   | /hotels/bookings/:bookingId/cancel   | Rider | Cancel booking        |

### Wallet & Transactions
| Method | Endpoint              | Role | Description              |
|--------|-----------------------|------|--------------------------|
| GET    | /wallet               | Any  | Get wallet balance       |
| GET    | /wallet/summary       | Any  | Wallet + stats summary   |
| POST   | /wallet/topup         | Any  | Add money to wallet      |
| POST   | /wallet/withdraw      | Any  | Withdraw from wallet     |
| GET    | /transactions         | Any  | Transaction history      |

### Notifications
| Method | Endpoint                       | Role | Description              |
|--------|--------------------------------|------|--------------------------|
| GET    | /notifications                 | Any  | List notifications       |
| GET    | /notifications/unread-count    | Any  | Unread count             |
| PATCH  | /notifications/mark-all-read   | Any  | Mark all as read         |
| DELETE | /notifications/clear-read      | Any  | Delete read notifications|
| PATCH  | /notifications/:id/read        | Any  | Mark single as read      |
| DELETE | /notifications/:id             | Any  | Delete notification      |

### Upload
| Method | Endpoint                              | Role   | Description          |
|--------|---------------------------------------|--------|----------------------|
| POST   | /upload/driver-document               | Driver | Upload document      |
| GET    | /upload/driver-documents              | Driver | List documents       |
| DELETE | /upload/driver-documents/:docId       | Driver | Delete document      |

---

## 🗄️ Database Schema

```
users
  ├── id, fullName, phone, email, password, role
  ├── avatar, isActive, lastLoginAt, refreshToken
  └── createdAt, updatedAt

drivers (1:1 → users)
  ├── id, userId, licenseNumber, vehicleType, vehicleNumber, vehicleModel
  ├── vehicleColor, vehicleYear, status, isOnline
  ├── rating, totalTrips, totalEarnings
  └── rejectionReason, approvedAt

driver_documents (N:1 → drivers)
  ├── id, driverId, documentType, fileName, filePath
  ├── mimeType, fileSize, status, reviewedAt, reviewNote
  └── createdAt, updatedAt

rides
  ├── id, riderId (→users), driverId (→users)
  ├── pickupLocation, dropLocation, rideType, fare, distance, duration
  ├── status, cancellationReason, cancelledBy
  ├── riderRating, driverRating, riderNote, driverNote
  └── acceptedAt, startedAt, completedAt, cancelledAt

buses
  ├── id, name, busNumber, operatorName
  ├── source, destination, departureTime, arrivalTime
  ├── price, totalSeats, bookedSeats, busType, rating
  ├── amenities (JSON), boardingPoints (JSON), droppingPoints (JSON)
  └── isActive, travelDate

bus_bookings (N:1 → users, N:1 → buses)
  ├── id, userId, busId, seatNumbers (JSON)
  ├── passengerName, passengerPhone, totalAmount
  ├── status, paymentStatus, paymentMethod, bookingRef
  └── cancellationReason, cancelledAt

hotels
  ├── id, name, description, location, city, country
  ├── pricePerNight, category, rating, reviewCount
  ├── amenities (JSON), roomTypes (JSON)
  └── isAvailable, totalRooms, isActive

hotel_bookings (N:1 → users, N:1 → hotels)
  ├── id, userId, hotelId, checkIn, checkOut
  ├── guests, rooms, roomType, guestName, guestPhone
  ├── totalNights, totalAmount, taxAmount
  ├── status, paymentStatus, paymentMethod, bookingRef
  └── specialRequests, cancellationReason, refundAmount

wallets (1:1 → users)
  ├── id, userId, balance, currency
  ├── totalCredits, totalDebits
  └── isActive, lastTransactionAt

transactions (N:1 → users, N:1 → wallets)
  ├── id, userId, walletId, type, amount
  ├── balanceBefore, balanceAfter, currency
  ├── category, description, reference, referenceType
  └── status, paymentGatewayRef, metadata

notifications (N:1 → users)
  ├── id, userId, title, message, type
  ├── isRead, readAt, referenceId, referenceType
  └── data (JSON), imageUrl, actionUrl, expiresAt
```

---

## 🔑 Demo Credentials (After Seeding)

| Role   | Email                    | Password       |
|--------|--------------------------|----------------|
| Admin  | admin@travelya.com       | Password@123   |
| Rider  | alice@travelya.com       | Password@123   |
| Rider  | bob@travelya.com         | Password@123   |
| Driver | carlos@travelya.com      | Password@123   |
| Driver | diana@travelya.com       | Password@123   |

---

## 🔒 Security Features

- **JWT** access tokens (7-day) + refresh tokens (30-day)
- **bcrypt** password hashing (12 salt rounds)
- **Helmet** security headers
- **Rate limiting**: 100 req/15min global, 10 req/15min for auth, 30/hr for bookings
- **Input validation** on every endpoint via Joi schemas
- **Role-based access control** (rider, driver, admin)
- **CORS** configured with allowlist
- **Sequelize parameterized queries** (SQL injection prevention)
- **Graceful shutdown** with connection cleanup

---

## 📜 npm Scripts

| Script            | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start with nodemon (hot reload)    |
| `npm start`       | Start production server            |
| `npm run db:migrate` | Run all pending migrations      |
| `npm run db:migrate:undo` | Rollback all migrations    |
| `npm run db:seed` | Insert demo seed data              |
| `npm run db:reset`| Full reset + migrate + seed        |

---

Built with ❤️ — Travelya Backend Engineering

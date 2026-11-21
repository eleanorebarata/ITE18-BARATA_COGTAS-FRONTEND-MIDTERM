# CSU Mobility: Frontend

Nuxt 4, Vue 3, and Pinia frontend for the CSU Main Campus Mobility system.

## Scope

This part of the project is the frontend. The backend team builds the NestJS API and the PostgreSQL database. Until their API is ready, the app uses a mock API in `app/mocks/` that saves sample data in the browser.

## Run it

Needs Node 20 or newer.

    npm install
    npm run dev

Open http://localhost:3000.

## Run the tests

    npm test

## Test accounts

Password for all accounts: `password123`. These are dummy accounts.

- Passenger: student@test.com (/auth/user-login)
- Driver: driver@test.com (/auth/driver-login)
- Administrator: admin@carsu.edu.ph (/auth/admin-login)
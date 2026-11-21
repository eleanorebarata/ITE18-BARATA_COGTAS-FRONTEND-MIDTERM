# CSU Main Campus Mobility (Frontend)

ITE 18 – AIEM1. Frontend by Demart Cogtas and Eleanore Barata. Nuxt 4 + Vue 3 + Pinia + Leaflet.

## Run
    npm install
    npm run dev

Open http://localhost:3000. The app uses built-in mock data (no backend needed).
To use the real API later, set `NUXT_PUBLIC_USE_MOCK=false` and `NUXT_PUBLIC_API_BASE` (see `.env.example`).

## Test accounts (password: password123)
- Passenger: student@test.com
- Suspended passenger: suspended@test.com
- Deactivated passenger: deactivated@test.com
- Driver (plate verified): driver@test.com
- Admin: admin@carsu.edu.ph

## Rules shown in the UI (the backend must enforce them)
- Accepted bookings can't be cancelled after 30 minutes.
- Cancelling without a valid reason gives warnings; 3 warnings means a 7-day suspension.
- Drivers must give a valid reason to decline and need a verified plate to accept.
- Accounts are deactivated, never deleted.
- Driver location is shared only during an accepted ride.
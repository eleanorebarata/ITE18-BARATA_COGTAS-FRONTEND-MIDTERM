# CSU Mobility: Frontend

Nuxt 4, Vue 3, and Pinia frontend for the CSU Main Campus Mobility system.

> The app runs on a **mock API** that lives in `app/mocks/` and saves data in the browser (localStorage). It is replaced by the NestJS API in the Final.

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Test accounts

The password for all accounts is `password123`. These are dummy accounts. Never type a real password while the mock is on.

| Role | Email | Login page |
|---|---|---|
| Passenger | student@test.com | /auth/user-login |
| Suspended passenger | suspended@test.com | /auth/user-login |
| Deactivated passenger | deactivated@test.com | /auth/user-login |
| Driver | driver@test.com | /auth/driver-login |
| Administrator | admin@carsu.edu.ph | /auth/admin-login |

## Switching to the real API

Copy `.env.example` to `.env` and set `NUXT_PUBLIC_USE_MOCK=false` and the real `NUXT_PUBLIC_API_BASE`. Then delete `app/mocks/` and the "Testing tools" boxes.

## Reset the mock data

Open the browser DevTools, then Application, then Local Storage, and delete the keys that start with `csu_mock_`.

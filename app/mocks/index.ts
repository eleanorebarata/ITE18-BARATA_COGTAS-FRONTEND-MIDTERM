import { fail } from "./errors";
import { doLogin } from "./auth";
import {
  getBooking,
  cancelBooking,
  createBooking,
  listBookings,
  getStanding,
  devAccept,
  devResetStanding,
  driverBookings,
  driverAccept,
  driverDecline,
  driverComplete,
  adminCancellations,
  adminExcuse,
} from "./bookings";
import { registerDriver, driverProfile, devVerifyPlate } from "./drivers";
import { places, fareOptions } from "./places";
import {
  adminSummary,
  adminUsers,
  setUserStatus,
  verifyDriverPlate,
  adminBookings,
  requireAdmin,
} from "./admin";
import {
  getReviewForBooking,
  createReview,
  driverReviews,
  setReviewHidden,
} from "./reviews";
import {
  createReport,
  myReports,
  adminReports,
  adminUpdateReport,
} from "./reports";
import {
  setDriverLocation,
  stopDriverLocation,
  getBookingTracking,
  devMoveDriver,
} from "./tracking";

type Query = Record<string, string>;
type Ctx = { userId: string | null };
type Route = [
  method: string,
  pattern: RegExp,
  handler: (m: RegExpMatchArray, body: any, query: Query, ctx: Ctx) => any,
];

function uid(ctx: Ctx) {
  if (!ctx.userId) throw fail(401, "UNAUTHORIZED", "Please log in.");
  return ctx.userId;
}

const routes: Route[] = [
  ["POST", /^\/auth\/user-login$/, (_m, b) => doLogin(b, "passenger")],
  ["POST", /^\/auth\/driver-login$/, (_m, b) => doLogin(b, "driver")],
  ["POST", /^\/auth\/admin-login$/, (_m, b) => doLogin(b, "admin")],
  ["POST", /^\/auth\/driver-register$/, (_m, b) => registerDriver(b)],

  ["GET", /^\/places$/, () => places],
  [
    "GET",
    /^\/fares$/,
    (_m, _b, q) => {
      const from = places.find((p) => p.id === q.from);
      const to = places.find((p) => p.id === q.to);
      if (!from || !to || from.id === to.id)
        throw fail(422, "VALIDATION", "Choose two different places.");
      return fareOptions(from, to);
    },
  ],

  ["GET", /^\/bookings$/, (_m, _b, _q, c) => listBookings(uid(c))],
  ["POST", /^\/bookings$/, (_m, b, _q, c) => createBooking(b, uid(c))],
  ["GET", /^\/bookings\/([^/]+)$/, (m) => getBooking(m[1]!)],
  ["POST", /^\/bookings\/([^/]+)\/cancel$/, (m, b) => cancelBooking(m[1]!, b)],
  ["GET", /^\/me\/standing$/, () => getStanding()],

  [
    "GET",
    /^\/bookings\/([^/]+)\/review$/,
    (m, _b, _q, c) => getReviewForBooking(uid(c), m[1]!),
  ],
  [
    "POST",
    /^\/bookings\/([^/]+)\/review$/,
    (m, b, _q, c) => createReview(uid(c), m[1]!, b),
  ],
  ["GET", /^\/drivers\/([^/]+)\/reviews$/, (m) => driverReviews(m[1]!)],

  ["POST", /^\/reports$/, (_m, b, _q, c) => createReport(uid(c), b)],
  ["GET", /^\/reports\/mine$/, (_m, _b, _q, c) => myReports(uid(c))],

  ["GET", /^\/driver\/profile$/, (_m, _b, _q, c) => driverProfile(uid(c))],
  ["GET", /^\/driver\/bookings$/, (_m, _b, _q, c) => driverBookings(uid(c))],
  [
    "POST",
    /^\/driver\/bookings\/([^/]+)\/accept$/,
    (m, _b, _q, c) => driverAccept(m[1]!, uid(c)),
  ],
  [
    "POST",
    /^\/driver\/bookings\/([^/]+)\/decline$/,
    (m, b, _q, c) => driverDecline(m[1]!, uid(c), b),
  ],
  [
    "POST",
    /^\/driver\/bookings\/([^/]+)\/complete$/,
    (m, _b, _q, c) => driverComplete(m[1]!, uid(c)),
  ],

  ["GET", /^\/admin\/summary$/, (_m, _b, _q, c) => adminSummary(uid(c))],
  ["GET", /^\/admin\/users$/, (_m, _b, q, c) => adminUsers(uid(c), q)],
  [
    "PATCH",
    /^\/admin\/users\/([^/]+)\/status$/,
    (m, b, _q, c) => setUserStatus(uid(c), m[1]!, b),
  ],
  [
    "PATCH",
    /^\/admin\/drivers\/([^/]+)\/plate$/,
    (m, b, _q, c) => verifyDriverPlate(uid(c), m[1]!, b),
  ],
  ["GET", /^\/admin\/bookings$/, (_m, _b, q, c) => adminBookings(uid(c), q)],
  ["GET", /^\/admin\/reports$/, (_m, _b, q, c) => adminReports(uid(c), q)],
  [
    "PATCH",
    /^\/admin\/reports\/([^/]+)$/,
    (m, b, _q, c) => adminUpdateReport(uid(c), m[1]!, b),
  ],
  [
    "PATCH",
    /^\/admin\/reviews\/([^/]+)\/hidden$/,
    (m, b, _q, c) => setReviewHidden(uid(c), m[1]!, b),
  ],
  [
    "GET",
    /^\/admin\/cancellations$/,
    (_m, _b, _q, c) => {
      requireAdmin(uid(c));
      return adminCancellations();
    },
  ],
  [
    "POST",
    /^\/admin\/cancellations\/([^/]+)\/excuse$/,
    (m, b, _q, c) => {
      requireAdmin(uid(c));
      return adminExcuse(m[1]!, b);
    },
  ],
  [
    "POST",
    /^\/driver\/location$/,
    (_m, b, _q, c) => setDriverLocation(uid(c), b),
  ],
  [
    "DELETE",
    /^\/driver\/location$/,
    (_m, _b, _q, c) => stopDriverLocation(uid(c)),
  ],
  [
    "GET",
    /^\/bookings\/([^/]+)\/location$/,
    (m, _b, _q, c) => getBookingTracking(uid(c), m[1]!),
  ],

  // Testing helpers, mock only
  ["POST", /^\/dev\/bookings\/([^/]+)\/accept$/, (m, b) => devAccept(m[1]!, b)],
  ["POST", /^\/dev\/reset-standing$/, () => devResetStanding()],
  [
    "POST",
    /^\/dev\/driver\/verify$/,
    (_m, _b, _q, c) => devVerifyPlate(uid(c)),
  ],
  [
    "POST",
    /^\/dev\/bookings\/([^/]+)\/move-driver$/,
    (m) => devMoveDriver(m[1]!),
  ],
];

export async function mockFetch<T = any>(
  path: string,
  opts: {
    method?: string;
    body?: any;
    query?: Query;
    token?: string | null;
  } = {},
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const method = (opts.method ?? "GET").toUpperCase();
  const route = routes.find(
    ([m, pattern]) => m === method && pattern.test(path),
  );
  if (!route) throw fail(404, "NOT_FOUND", `No mock for ${method} ${path}`);
  const userId = opts.token?.startsWith("mock-") ? opts.token.slice(5) : null;
  return route[2](path.match(route[1])!, opts.body, opts.query ?? {}, {
    userId,
  }) as T;
}

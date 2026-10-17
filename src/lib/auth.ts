import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { adapter } from "./db";

export const auth = betterAuth({
	database: adapter,
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 15,
		},
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 10,
	},
	advanced: {
		defaultCookieAttributes: {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		},
	},
	plugins: [tanstackStartCookies()],
});

export default auth;

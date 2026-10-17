import { getRequest } from "@tanstack/react-start/server";

import { auth } from "./auth";
import { type Role, getUserRole } from "./db";

/**
 * Read the current better-auth session from the incoming request.
 *
 * Must only be called from server code (server functions, API route handlers,
 * or TanStack Start loaders executed on the server) because it relies on
 * `getRequest()`.
 */
export async function getCurrentSession() {
	const request = getRequest();
	const result = await auth.api.getSession({
		headers: request.headers,
	});
	return {
		session: result?.session ?? null,
		user: result?.user ?? null,
	};
}

export async function requireAuth() {
	const { session, user } = await getCurrentSession();
	if (!session || !user) {
		const err = new Error("Unauthorized") as Error & { status?: number };
		err.status = 401;
		throw err;
	}
	return { session, user };
}

export async function requireAdmin() {
	const { user, session } = await requireAuth();
	const role: Role = getUserRole(user.id);
	if (role !== "admin") {
		const err = new Error("Forbidden: admin required") as Error & {
			status?: number;
		};
		err.status = 403;
		throw err;
	}
	return { user, session };
}

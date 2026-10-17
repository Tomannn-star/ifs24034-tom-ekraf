import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, db } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";

/**
 * Server-only session lookup. Safe to call from TanStack Router `beforeLoad`
 * (which runs on the client during client navigation) because server
 * functions always execute on the server.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
	return getCurrentSession();
});

/**
 * One-time development seed: creates the administrator account (password
 * hashed by Better Auth) and seeds sample products. Idempotent.
 *
 * Called from the client via `useServerFn(seedAdmin)` on the /setup page.
 */
export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
	let adminUser = db.user.find((u) => u.email === SEED_ADMIN_EMAIL);
	const hasAdminRole = db.user.some((u) => {
		const role = db.userRole.find((r) => r.userId === u.id)?.role;
		return role === "admin";
	});

	if (adminUser || hasAdminRole) {
		if (adminUser) {
			const existing = db.userRole.find((r) => r.userId === adminUser.id);
			if (existing) {
				existing.role = "admin";
			} else {
				db.userRole.push({ userId: adminUser.id, role: "admin" });
			}
		}
		if (db.product.length === 0) {
			seedProducts();
		}
		return { ok: true, alreadySeeded: true, admin: SEED_ADMIN_EMAIL };
	}

	try {
		await auth.api.signUpEmail({
			body: {
				email: SEED_ADMIN_EMAIL,
				password: SEED_ADMIN_PASSWORD,
				name: "Administrator",
			},
			headers: new Headers(),
		});
	} catch (_err) {
		// Better auth might already have user
	}

	adminUser = db.user.find((u) => u.email === SEED_ADMIN_EMAIL);
	if (adminUser) {
		const existing = db.userRole.find((r) => r.userId === adminUser.id);
		if (existing) {
			existing.role = "admin";
		} else {
			db.userRole.push({ userId: adminUser.id, role: "admin" });
		}
	}

	if (db.product.length === 0) {
		seedProducts();
	}

	return { ok: true, alreadySeeded: false, admin: SEED_ADMIN_EMAIL };
});

function seedProducts() {
	const now = new Date().toISOString();
	const products = [
		{
			name: "Starter Kit",
			description: "Everything you need to begin.",
			price: 49,
			stock: 12,
			imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=512&q=80",
		},
		{
			name: "Pro Plan",
			description: "For growing teams.",
			price: 149,
			stock: 5,
			imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=512&q=80",
		},
		{
			name: "Enterprise",
			description: "Self-hosted, full support.",
			price: 499,
			stock: 1,
			imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=512&q=80",
		},
	].map((p) => ({
		id: crypto.randomUUID(),
		...p,
		createdAt: now,
		updatedAt: now,
	}));
	db.product.push(...products);
}

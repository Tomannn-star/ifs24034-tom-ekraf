import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { db, getUserRole, removeUserRole, setUserRole } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const userRoleSchema = z.object({
	userId: z.string(),
	role: z.enum(["admin", "user"]),
});

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	await requireAdmin();
	return db.user.map((u) => ({
		id: u.id,
		email: u.email,
		name: u.name,
		role: getUserRole(u.id),
		emailVerified: !!u.emailVerified,
		createdAt: u.createdAt.toISOString(),
	}));
});

export const updateUserRole = createServerFn({ method: "POST" })
	.validator(userRoleSchema)
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();
		// Block self-role-demotion for admins
		if (user.id === data.userId && data.role !== "admin") {
			const err = new Error(
				"Security violation: Administrators cannot demote their own account",
			) as Error & {
				status?: number;
			};
			err.status = 400;
			throw err;
		}
		setUserRole(data.userId, data.role);
		return { ok: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.validator(z.object({ userId: z.string().min(1, "User ID is required") }))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();
		// Block self-deletion for admins
		if (user.id === data.userId) {
			const err = new Error(
				"Security violation: Administrators cannot delete their own account",
			) as Error & {
				status?: number;
			};
			err.status = 400;
			throw err;
		}
		// Prevent removing the last administrator so the app never locks itself out.
		const role = getUserRole(data.userId);
		if (role === "admin") {
			const adminCount = db.userRole.filter((r) => r.role === "admin").length;
			if (adminCount <= 1) {
				const err = new Error("Cannot delete the last administrator") as Error & {
					status?: number;
				};
				err.status = 400;
				throw err;
			}
		}
		db.user = db.user.filter((u) => u.id !== data.userId);
		removeUserRole(data.userId);
		return { ok: true };
	});

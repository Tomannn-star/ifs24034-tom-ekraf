import { beforeEach, describe, expect, it } from "bun:test";
import { SEED_ADMIN_EMAIL, db, getUserRole, removeUserRole, setUserRole } from "@/lib/db";

describe("db in-memory role management", () => {
	beforeEach(() => {
		db.user = [];
		db.userRole = [];
		db.product = [];
	});

	it("returns 'admin' if user has seed admin email", () => {
		db.user.push({
			id: "admin-1",
			email: SEED_ADMIN_EMAIL,
			name: "Admin User",
			image: null,
			emailVerified: true,
			emailVerifiedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
			lastSignInAt: null,
		});

		expect(getUserRole("admin-1")).toBe("admin");
	});

	it("returns assigned role from userRole table", () => {
		db.user.push({
			id: "user-1",
			email: "regular@example.com",
			name: "Regular",
			image: null,
			emailVerified: false,
			emailVerifiedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastSignInAt: null,
		});

		setUserRole("user-1", "admin");
		expect(getUserRole("user-1")).toBe("admin");

		setUserRole("user-1", "user");
		expect(getUserRole("user-1")).toBe("user");
	});

	it("defaults to 'user' when no role is found", () => {
		expect(getUserRole("unknown-id")).toBe("user");
	});

	it("removes user role properly", () => {
		setUserRole("user-2", "admin");
		expect(getUserRole("user-2")).toBe("admin");

		removeUserRole("user-2");
		expect(getUserRole("user-2")).toBe("user");
	});
});

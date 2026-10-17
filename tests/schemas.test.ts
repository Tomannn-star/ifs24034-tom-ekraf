import { describe, expect, it } from "bun:test";
import { productSchema, userRoleSchema } from "@/lib/schemas";

describe("productSchema validation", () => {
	it("validates a valid product with https url", () => {
		const valid = {
			name: "Batik Parang",
			description: "Kain batik tradisional handmade",
			price: 250000,
			stock: 15,
			imageUrl: "https://example.com/batik.jpg",
		};
		const result = productSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it("validates a product with http url, null or optional image", () => {
		const withHttp = productSchema.safeParse({
			name: "Batik Kawung",
			description: "Motif klasik Jawa",
			price: 150000,
			stock: 10,
			imageUrl: "http://example.com/kawung.jpg",
		});
		expect(withHttp.success).toBe(true);

		const withNull = productSchema.safeParse({
			name: "Batik Mega Mendung",
			description: "Motif khas Cirebon",
			price: 200000,
			stock: 5,
			imageUrl: null,
		});
		expect(withNull.success).toBe(true);

		const withoutImage = productSchema.safeParse({
			name: "Kain Tenun",
			description: "Tenun ikat tradisional",
			price: "300000",
			stock: "4",
		});
		expect(withoutImage.success).toBe(true);
	});

	it("accepts valid data:image URI", () => {
		const valid = {
			name: "Anyaman Rotan",
			description: "Tas anyaman rotan ramah lingkungan",
			price: 120000,
			stock: 5,
			imageUrl:
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
		};
		const result = productSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it("rejects empty name or description", () => {
		const invalid = {
			name: "   ",
			description: "",
			price: 10000,
			stock: 2,
		};
		const result = productSchema.safeParse(invalid);
		expect(result.success).toBe(false);
	});

	it("rejects negative price or stock, or floating stock", () => {
		const negative = productSchema.safeParse({
			name: "Ukiran Kayu",
			description: "Ukiran khas Jepara",
			price: -500,
			stock: -1,
		});
		expect(negative.success).toBe(false);

		const floatStock = productSchema.safeParse({
			name: "Ukiran Kayu",
			description: "Ukiran khas Jepara",
			price: 50000,
			stock: 2.5,
		});
		expect(floatStock.success).toBe(false);
	});

	it("rejects price or stock exceeding limits", () => {
		const overPrice = productSchema.safeParse({
			name: "Patung Emas",
			description: "Patung emas murni",
			price: 2_000_000,
			stock: 1,
		});
		expect(overPrice.success).toBe(false);

		const overStock = productSchema.safeParse({
			name: "Gantungan Kunci",
			description: "Souvenir murah",
			price: 5000,
			stock: 2_000_000,
		});
		expect(overStock.success).toBe(false);
	});

	it("rejects non-http / non-data image URLs", () => {
		const invalid = {
			name: "Kerajinan Perak",
			description: "Cincin perak khas Kotagede",
			price: 500000,
			stock: 3,
			imageUrl: "ftp://example.com/image.png",
		};
		const result = productSchema.safeParse(invalid);
		expect(result.success).toBe(false);
	});
});

describe("userRoleSchema validation", () => {
	it("accepts valid admin or user role", () => {
		expect(userRoleSchema.safeParse({ userId: "u1", role: "admin" }).success).toBe(true);
		expect(userRoleSchema.safeParse({ userId: "u2", role: "user" }).success).toBe(true);
	});

	it("rejects invalid role string or empty userId", () => {
		expect(userRoleSchema.safeParse({ userId: "u1", role: "superadmin" }).success).toBe(false);
		expect(userRoleSchema.safeParse({ userId: "", role: "admin" }).success).toBe(false);
	});
});

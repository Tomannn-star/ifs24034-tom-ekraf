import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { type Product, db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/session";

export const productSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120, "Name cannot exceed 120 characters"),
	description: z
		.string()
		.trim()
		.min(1, "Description is required")
		.max(1000, "Description cannot exceed 1000 characters"),
	price: z.coerce.number().min(0, "Price must be positive").max(1_000_000, "Price is too high"),
	stock: z.coerce
		.number()
		.int("Stock must be an integer")
		.min(0, "Stock must be positive")
		.max(1_000_000, "Stock is too high"),
	imageUrl: z
		.string()
		.trim()
		.max(500_000, "Image URL or data is too large")
		.refine(
			(val) => {
				if (!val) return true;
				return (
					val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/")
				);
			},
			{ message: "Image must be an HTTP/HTTPS URL or an image data URI" },
		)
		.optional()
		.nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;

// TanStack Start server functions support GET and POST only. Mutations use
// POST and encode the intended action in the validator/body.
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	return [...db.product].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Product[];
});

export const createProduct = createServerFn({ method: "POST" })
	.validator(productSchema)
	.handler(async ({ data }) => {
		await requireAdmin();
		const now = new Date().toISOString();
		const product = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description,
			price: data.price,
			stock: data.stock,
			imageUrl: data.imageUrl ?? null,
			createdAt: now,
			updatedAt: now,
		} as Product;
		db.product.push(product);
		return product;
	});

export const updateProduct = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string().min(1, "ID is required"),
			...productSchema.shape,
		}),
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		const now = new Date().toISOString();
		const updated = {
			...db.product[index],
			name: data.name,
			description: data.description,
			price: data.price,
			stock: data.stock,
			imageUrl: data.imageUrl ?? null,
			updatedAt: now,
		} as Product;
		db.product[index] = updated;
		return updated;
	});

export const deleteProduct = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireAdmin();
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		db.product.splice(index, 1);
		return { ok: true };
	});

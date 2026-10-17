import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { type Product, db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/session";

import { type ProductInput, productSchema } from "@/lib/schemas";

export { type ProductInput, productSchema };

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

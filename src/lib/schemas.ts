import { z } from "zod";

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

export const userRoleSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	role: z.enum(["admin", "user"]),
});

export type UserRoleInput = z.infer<typeof userRoleSchema>;

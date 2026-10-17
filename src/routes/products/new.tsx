import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServerSession } from "@/lib/server/auth";
import { createProduct } from "@/lib/server/products";

export const Route = createFileRoute("/products/new")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: NewProductPage,
});

function NewProductPage() {
	const navigate = useNavigate();
	const createFn = useServerFn(createProduct);
	const [serverError, setServerError] = useState<string | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			price: "",
			stock: "",
			imageUrl: "",
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			if (imageError) return;

			const numPrice = Number(value.price);
			const numStock = Number(value.stock);

			if (Number.isNaN(numPrice) || numPrice < 0) {
				setServerError("Price must be a valid positive number.");
				return;
			}
			if (Number.isNaN(numStock) || numStock < 0) {
				setServerError("Stock must be a valid positive integer.");
				return;
			}

			try {
				await createFn({
					data: {
						name: value.name.trim(),
						description: value.description.trim(),
						price: numPrice,
						stock: Math.floor(numStock),
						imageUrl: imagePreview || null,
					},
				});
				await navigate({ to: "/products" });
			} catch (err) {
				setServerError(err instanceof Error ? err.message : "Failed to create product.");
			}
		},
	});

	const validateImageUrl = (url: string) => {
		setImageError(null);
		if (!url) {
			setImagePreview(null);
			return;
		}
		const img = new Image();
		img.onload = () => {
			if (img.width > 512 || img.height > 512) {
				setImageError(
					`Image (${img.width}x${img.height}px) exceeds max dimension limit of 512x512px.`,
				);
			} else {
				setImagePreview(url);
			}
		};
		img.onerror = () => {
			setImageError("Unable to load image from URL.");
			setImagePreview(null);
		};
		img.src = url;
	};

	return (
		<DashboardShell
			title="Create Product"
			description="Add a new catalog item with pricing, inventory and image."
		>
			<div className="max-w-2xl">
				<div className="mb-4">
					<Link
						to="/products"
						className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
					>
						<ArrowLeft className="size-3.5" /> Back to Products
					</Link>
				</div>

				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm sm:p-8">
					{serverError && (
						<div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
							{serverError}
						</div>
					)}

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field
							name="name"
							validators={{
								onChange: ({ value }) => (!value.trim() ? "Name is required" : undefined),
							}}
						>
							{(field) => (
								<div className="space-y-1.5">
									<Label
										htmlFor={field.name}
										className="text-xs font-semibold text-[var(--sea-ink)]"
									>
										Product Name *
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g. Ergonomic Desk Chair"
										className="w-full"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-xs text-red-600 font-medium">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="description"
							validators={{
								onChange: ({ value }) => (!value.trim() ? "Description is required" : undefined),
							}}
						>
							{(field) => (
								<div className="space-y-1.5">
									<Label
										htmlFor={field.name}
										className="text-xs font-semibold text-[var(--sea-ink)]"
									>
										Description *
									</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Describe the product specifications..."
										rows={3}
										className="w-full"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-xs text-red-600 font-medium">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field
								name="price"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "Price is required";
										const n = Number(value);
										if (Number.isNaN(n) || n < 0) return "Must be positive";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-xs font-semibold text-[var(--sea-ink)]"
										>
											Price ($) *
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											step="0.01"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="99.00"
											className="w-full"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-xs text-red-600 font-medium">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<form.Field
								name="stock"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "Stock is required";
										const n = Number(value);
										if (Number.isNaN(n) || n < 0) return "Must be positive";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-xs font-semibold text-[var(--sea-ink)]"
										>
											Stock Count *
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="25"
											className="w-full"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-xs text-red-600 font-medium">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="imageUrl">
							{(field) => (
								<div className="space-y-1.5 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3">
									<Label
										htmlFor={field.name}
										className="text-xs font-semibold text-[var(--sea-ink)] flex items-center gap-1.5"
									>
										<ImageIcon className="size-3.5" /> Image URL (Max 512px)
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="url"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											field.handleChange(e.target.value);
											validateImageUrl(e.target.value.trim());
										}}
										placeholder="https://images.unsplash.com/photo-..."
										className="w-full text-xs"
									/>
									{imageError && <p className="text-xs text-red-600 font-medium">{imageError}</p>}
									{imagePreview && (
										<div className="mt-2 flex items-center justify-center p-2 rounded border border-[var(--line)] bg-surface">
											<img
												src={imagePreview}
												alt="Preview"
												className="max-h-32 object-contain rounded"
											/>
										</div>
									)}
								</div>
							)}
						</form.Field>

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/products" })}
								disabled={form.state.isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={form.state.isSubmitting || Boolean(imageError)}>
								{form.state.isSubmitting ? (
									<>
										<Loader2 className="mr-1.5 size-4 animate-spin" /> Creating...
									</>
								) : (
									"Create Product"
								)}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</DashboardShell>
	);
}

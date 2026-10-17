import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServerSession } from "@/lib/server/auth";
import { deleteProduct, getProducts, updateProduct } from "@/lib/server/products";

export const Route = createFileRoute("/products/$productId")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: EditProductPage,
});

function EditProductPage() {
	const { productId } = useParams({
		from: "/products/$productId",
	});
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const updateFn = useServerFn(updateProduct);
	const deleteFn = useServerFn(deleteProduct);

	const [serverError, setServerError] = useState<string | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	const productQuery = useQuery({
		queryKey: ["product", productId],
		queryFn: async () => {
			const products = await getProducts();
			return products.find((p) => p.id === productId);
		},
		enabled: Boolean(productId),
	});

	const product = productQuery.data;

	const form = useForm({
		defaultValues: {
			name: product?.name ?? "",
			description: product?.description ?? "",
			price: product ? String(product.price) : "",
			stock: product ? String(product.stock) : "",
			imageUrl: product?.imageUrl ?? "",
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
				await updateFn({
					data: {
						id: productId,
						name: value.name.trim(),
						description: value.description.trim(),
						price: numPrice,
						stock: Math.floor(numStock),
						imageUrl: imagePreview || null,
					},
				});
				await queryClient.invalidateQueries({ queryKey: ["products"] });
				await queryClient.invalidateQueries({ queryKey: ["product", productId] });
				await navigate({ to: "/products" });
			} catch (err) {
				setServerError(err instanceof Error ? err.message : "Failed to update product.");
			}
		},
	});

	useEffect(() => {
		if (product) {
			form.reset({
				name: product.name,
				description: product.description,
				price: String(product.price),
				stock: String(product.stock),
				imageUrl: product.imageUrl ?? "",
			});
			setImagePreview(product.imageUrl ?? null);
		}
	}, [product, form]);

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

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete this product?")) {
			return;
		}
		setDeleting(true);
		try {
			await deleteFn({ data: { id: productId } });
			await queryClient.invalidateQueries({ queryKey: ["products"] });
			await navigate({ to: "/products" });
		} catch (err) {
			setServerError(err instanceof Error ? err.message : "Failed to delete product.");
		} finally {
			setDeleting(false);
		}
	};

	if (productQuery.isPending) {
		return (
			<DashboardShell title="Edit Product">
				<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading product details...
				</div>
			</DashboardShell>
		);
	}

	if (!product) {
		return (
			<DashboardShell title="Product Not Found">
				<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)] space-y-3">
					<p>The requested product does not exist or has been removed.</p>
					<Link to="/products" className="text-xs font-semibold text-[var(--sea-ink)] underline">
						Return to products
					</Link>
				</div>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell
			title={`Edit ${product.name}`}
			description="Update product attributes, stock level and thumbnail image."
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

						<div className="flex items-center justify-between pt-4">
							<Button
								type="button"
								variant="destructive"
								onClick={handleDelete}
								disabled={deleting || form.state.isSubmitting}
								className="gap-1.5"
							>
								<Trash2 className="size-4" /> {deleting ? "Deleting..." : "Delete"}
							</Button>

							<div className="flex gap-2">
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
											<Loader2 className="mr-1.5 size-4 animate-spin" /> Saving...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</DashboardShell>
	);
}

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/db";
import { createProduct, updateProduct } from "@/lib/server/products";

interface ProductFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product?: Product | null;
	onSuccess?: () => void;
}

export function ProductFormModal({
	open,
	onOpenChange,
	product,
	onSuccess,
}: ProductFormModalProps) {
	const isEdit = Boolean(product);
	const queryClient = useQueryClient();
	const createFn = useServerFn(createProduct);
	const updateFn = useServerFn(updateProduct);

	const [imageMode, setImageMode] = useState<"url" | "upload">("url");
	const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ?? null);
	const [imageError, setImageError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// TanStack Form
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

			if (imageError) {
				return;
			}

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
				if (isEdit && product) {
					await updateFn({
						data: {
							id: product.id,
							name: value.name.trim(),
							description: value.description.trim(),
							price: numPrice,
							stock: Math.floor(numStock),
							imageUrl: imagePreview || null,
						},
					});
				} else {
					await createFn({
						data: {
							name: value.name.trim(),
							description: value.description.trim(),
							price: numPrice,
							stock: Math.floor(numStock),
							imageUrl: imagePreview || null,
						},
					});
				}

				await queryClient.invalidateQueries({ queryKey: ["products"] });
				await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
				onOpenChange(false);
				onSuccess?.();
			} catch (err) {
				setServerError(err instanceof Error ? err.message : "Failed to save product.");
			}
		},
	});

	// Reset form when modal opens or product changes
	useEffect(() => {
		if (open) {
			form.reset({
				name: product?.name ?? "",
				description: product?.description ?? "",
				price: product ? String(product.price) : "",
				stock: product ? String(product.stock) : "",
				imageUrl: product?.imageUrl ?? "",
			});
			setImagePreview(product?.imageUrl ?? null);
			setImageError(null);
			setServerError(null);
		}
	}, [open, product, form]);

	// Image dimension validator and downscaler (max 512px)
	const processImage = (src: string, isDataUri = false) => {
		setImageError(null);
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const maxDim = 512;
			if (img.width > maxDim || img.height > maxDim) {
				if (isDataUri) {
					// Automatically downscale uploaded image file to 512px max
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;
					if (width > height) {
						if (width > maxDim) {
							height = Math.round((height * maxDim) / width);
							width = maxDim;
						}
					} else {
						if (height > maxDim) {
							width = Math.round((width * maxDim) / height);
							height = maxDim;
						}
					}
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(img, 0, 0, width, height);
						const downscaled = canvas.toDataURL("image/jpeg", 0.85);
						setImagePreview(downscaled);
						form.setFieldValue("imageUrl", downscaled);
						return;
					}
				}
				setImageError(
					`Image dimensions (${img.width}x${img.height}px) exceed max limit of 512x512px.`,
				);
			} else {
				setImagePreview(src);
				form.setFieldValue("imageUrl", src);
			}
		};
		img.onerror = () => {
			setImageError("Could not load image. Please provide a valid accessible image URL or file.");
			setImagePreview(null);
		};
		img.src = src;
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setImageError("Selected file must be an image.");
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			setImageError("Image file size must be under 2MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const base64 = event.target?.result as string;
			processImage(base64, true);
		};
		reader.readAsDataURL(file);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">
						{isEdit ? "Edit Product" : "Create New Product"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Modify the product details below. Keystrokes and changes are validated real-time."
							: "Fill in the product details. Image is capped at max 512px."}
					</DialogDescription>
				</DialogHeader>

				{serverError && (
					<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
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
					{/* Name Field */}
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) => (!value.trim() ? "Product name is required" : undefined),
						}}
					>
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-xs font-semibold text-[var(--sea-ink)]">
									Product Name *
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="e.g. Wireless Ergonomic Mouse"
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

					{/* Description Field */}
					<form.Field
						name="description"
						validators={{
							onChange: ({ value }) => (!value.trim() ? "Description is required" : undefined),
						}}
					>
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-xs font-semibold text-[var(--sea-ink)]">
									Description *
								</Label>
								<Textarea
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Provide a detailed overview of the product..."
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

					{/* Price & Stock */}
					<div className="grid grid-cols-2 gap-3">
						<form.Field
							name="price"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Price is required";
									const num = Number(value);
									if (Number.isNaN(num) || num < 0) return "Must be positive";
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
										min="0"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="49.99"
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
									const num = Number(value);
									if (Number.isNaN(num) || num < 0) return "Must be positive";
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
										Stock Units *
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										step="1"
										min="0"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="10"
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

					{/* Product Image Input */}
					<div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-[var(--sea-ink)] flex items-center gap-1.5">
								<ImageIcon className="size-3.5" /> Product Image (Max 512px)
							</Label>
							<div className="flex rounded-md border border-[var(--line)] bg-[var(--surface-strong)] p-0.5 text-[11px]">
								<button
									type="button"
									onClick={() => setImageMode("url")}
									className={`px-2 py-0.5 rounded ${
										imageMode === "url"
											? "bg-primary text-primary-foreground font-semibold"
											: "text-[var(--sea-ink-soft)]"
									}`}
								>
									URL
								</button>
								<button
									type="button"
									onClick={() => setImageMode("upload")}
									className={`px-2 py-0.5 rounded ${
										imageMode === "upload"
											? "bg-primary text-primary-foreground font-semibold"
											: "text-[var(--sea-ink-soft)]"
									}`}
								>
									Upload File
								</button>
							</div>
						</div>

						{imageMode === "url" ? (
							<form.Field name="imageUrl">
								{(field) => (
									<div className="space-y-1">
										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												field.handleChange(e.target.value);
												if (e.target.value.trim()) {
													processImage(e.target.value.trim(), false);
												} else {
													setImagePreview(null);
													setImageError(null);
												}
											}}
											placeholder="https://example.com/product.jpg"
											className="w-full text-xs"
										/>
									</div>
								)}
							</form.Field>
						) : (
							<div className="flex items-center gap-2">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileUpload}
									accept="image/*"
									className="hidden"
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
									className="w-full gap-2 text-xs"
								>
									<Upload className="size-3.5" /> Choose Image File (auto-downscaled to ≤512px)
								</Button>
							</div>
						)}

						{imageError && <p className="text-xs text-red-600 font-medium">{imageError}</p>}

						{/* Image Preview */}
						{imagePreview && (
							<div className="relative mt-2 flex items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2">
								<img
									src={imagePreview}
									alt="Preview"
									className="max-h-36 max-w-full rounded object-contain shadow-xs"
								/>
								<button
									type="button"
									onClick={() => {
										setImagePreview(null);
										form.setFieldValue("imageUrl", "");
										setImageError(null);
									}}
									className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
								>
									<X className="size-3" />
								</button>
							</div>
						)}
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={form.state.isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={form.state.isSubmitting || Boolean(imageError)}>
							{form.state.isSubmitting ? (
								<>
									<Loader2 className="size-4 animate-spin mr-1.5" />
									{isEdit ? "Saving..." : "Creating..."}
								</>
							) : isEdit ? (
								"Save Changes"
							) : (
								"Create Product"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

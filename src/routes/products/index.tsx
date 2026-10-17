import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	createColumnHelper,
	flexRender,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import {
	AlertCircle,
	ArrowUpDown,
	Edit,
	Image as ImageIcon,
	Package,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { ProductFormModal } from "@/components/ProductFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";
import { deleteProduct, getProducts } from "@/lib/server/products";

export const Route = createFileRoute("/products/")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			return redirect({ to: "/login" }) as any;
		}
	},
	component: ProductsPage,
});

function ProductsPage() {
	const queryClient = useQueryClient();
	const deleteFn = useServerFn(deleteProduct);

	const [formModalOpen, setFormModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const productsQuery = useQuery({
		queryKey: ["products"],
		queryFn: async () => getProducts(),
	});

	const allProducts = productsQuery.data ?? [];
	const filteredProducts = allProducts.filter(
		(p) =>
			p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.description.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const features = tableFeatures({ rowSortingFeature });
	const columnHelper = createColumnHelper<typeof features, Product>();

	const columns = columnHelper.columns([
		columnHelper.display({
			id: "image",
			header: "Image",
			cell: (info) => {
				const product = info.row.original as Product;
				return (
					<div className="size-10 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] flex items-center justify-center">
						{product.imageUrl ? (
							<img
								src={product.imageUrl}
								alt={product.name}
								className="size-full object-cover"
								onError={(e) => {
									(e.currentTarget as HTMLImageElement).style.display = "none";
								}}
							/>
						) : (
							<ImageIcon className="size-5 text-[var(--sea-ink-soft)] opacity-60" />
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor("name", {
			header: ({ column }) => (
				<button
					type="button"
					onClick={() => column.toggleSorting()}
					className="flex items-center gap-1 font-semibold hover:text-[var(--sea-ink)]"
				>
					Name <ArrowUpDown className="size-3" />
				</button>
			),
			cell: (info) => {
				const product = info.row.original as Product;
				return (
					<div>
						<p className="font-semibold text-[var(--sea-ink)]">{product.name}</p>
						<p className="line-clamp-1 text-xs text-[var(--sea-ink-soft)] max-w-xs">
							{product.description}
						</p>
					</div>
				);
			},
		}),
		columnHelper.accessor("price", {
			header: ({ column }) => (
				<button
					type="button"
					onClick={() => column.toggleSorting()}
					className="flex items-center gap-1 font-semibold hover:text-[var(--sea-ink)]"
				>
					Price <ArrowUpDown className="size-3" />
				</button>
			),
			cell: (info) => (
				<span className="font-medium text-[var(--sea-ink)]">
					${Number(info.getValue()).toFixed(2)}
				</span>
			),
		}),
		columnHelper.accessor("stock", {
			header: ({ column }) => (
				<button
					type="button"
					onClick={() => column.toggleSorting()}
					className="flex items-center gap-1 font-semibold hover:text-[var(--sea-ink)]"
				>
					Stock <ArrowUpDown className="size-3" />
				</button>
			),
			cell: (info) => {
				const stock = Number(info.getValue());
				return (
					<span
						className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
							stock > 5
								? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
								: stock > 0
									? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
									: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
						}`}
					>
						{stock} in stock
					</span>
				);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				const product = info.row.original as Product;
				return (
					<div className="flex items-center gap-1.5">
						<Button
							variant="ghost"
							size="xs"
							onClick={() => {
								setSelectedProduct(product);
								setFormModalOpen(true);
							}}
							className="h-7 px-2 text-xs gap-1"
							title="Edit Product"
						>
							<Edit className="size-3" /> Edit
						</Button>
						<Button
							variant="ghost"
							size="xs"
							onClick={() => setDeleteConfirmId(product.id)}
							className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
							title="Delete Product"
						>
							<Trash2 className="size-3" /> Delete
						</Button>
					</div>
				);
			},
		}),
	]);

	const table = useTable({
		features,
		columns,
		data: filteredProducts,
	});

	const handleDelete = async (id: string) => {
		setDeleting(true);
		try {
			await deleteFn({ data: { id } });
			await queryClient.invalidateQueries({ queryKey: ["products"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			setDeleteConfirmId(null);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete product.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<DashboardShell
			title="Products Catalog"
			description="Manage product listings, inventory, and images with max 512px enforcement."
			actions={
				<Button
					onClick={() => {
						setSelectedProduct(null);
						setFormModalOpen(true);
					}}
					size="sm"
					className="gap-1.5 font-medium shadow-sm"
				>
					<Plus className="size-4" /> Add Product
				</Button>
			}
		>
			{/* Search & Filter Toolbar */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-2.5 size-4 text-[var(--sea-ink-soft)]" />
					<Input
						placeholder="Search products..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<p className="text-xs text-[var(--sea-ink-soft)] self-start sm:self-center">
					Showing {filteredProducts.length} of {allProducts.length} items
				</p>
			</div>

			{/* Error State */}
			{productsQuery.isError && (
				<div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
					<AlertCircle className="size-4 shrink-0" />
					<span>Failed to load products: {(productsQuery.error as Error).message}</span>
				</div>
			)}

			{/* Loading State */}
			{productsQuery.isPending && (
				<div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6">
					<div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
					<div className="h-10 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
					<div className="h-10 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
					<div className="h-10 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
				</div>
			)}

			{/* Products Table / Cards */}
			{!productsQuery.isPending && (
				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm overflow-hidden">
					{filteredProducts.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]">
								<Package className="size-7 opacity-50" />
							</div>
							<h3 className="mt-3 text-base font-bold text-[var(--sea-ink)]">
								{searchTerm ? "No matching products found" : "No products yet"}
							</h3>
							<p className="mt-1 text-xs text-[var(--sea-ink-soft)] max-w-sm">
								{searchTerm
									? "Try searching for a different keyword or reset your filter."
									: "Your product inventory is currently empty. Create your first product or seed sample data."}
							</p>
							{!searchTerm && (
								<Button
									size="sm"
									onClick={() => {
										setSelectedProduct(null);
										setFormModalOpen(true);
									}}
									className="mt-4 gap-1.5 text-xs"
								>
									<Plus className="size-3.5" /> Create Product
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								<thead>
									{table.getHeaderGroups().map((headerGroup) => (
										<tr
											key={headerGroup.id}
											className="border-b border-[var(--line)] bg-[var(--chip-bg)]"
										>
											{headerGroup.headers.map((header) => (
												<th
													key={header.id}
													colSpan={header.colSpan}
													className="px-4 py-3 text-xs font-semibold text-[var(--sea-ink-soft)]"
												>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
												</th>
											))}
										</tr>
									))}
								</thead>
								<tbody className="divide-y divide-[var(--line)]">
									{table.getRowModel().rows.map((row) => (
										<tr key={row.id} className="transition-colors hover:bg-[var(--chip-bg)]/40">
											{row.getAllCells().map((cell) => (
												<td key={cell.id} className="px-4 py-3.5 align-middle">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Delete Confirmation Alert Modal */}
			{deleteConfirmId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
					<div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-2xl space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
								<Trash2 className="size-5" />
							</div>
							<div>
								<h4 className="text-base font-bold text-[var(--sea-ink)]">Confirm Deletion</h4>
								<p className="text-xs text-[var(--sea-ink-soft)]">
									Are you sure you want to delete this product?
								</p>
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDeleteConfirmId(null)}
								disabled={deleting}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleDelete(deleteConfirmId)}
								disabled={deleting}
							>
								{deleting ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Product Modal (Create & Edit) */}
			<ProductFormModal
				open={formModalOpen}
				onOpenChange={setFormModalOpen}
				product={selectedProduct}
				onSuccess={() => productsQuery.refetch()}
			/>
		</DashboardShell>
	);
}

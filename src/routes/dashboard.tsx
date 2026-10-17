import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Database, Package, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { ProductFormModal } from "@/components/ProductFormModal";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getServerSession } from "@/lib/server/auth";
import { getProducts } from "@/lib/server/products";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: Dashboard,
});

function Dashboard() {
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const { data: session } = authClient.useSession();
	const isAdmin = session?.user?.email === "admin@example.com";

	const productsQuery = useQuery({
		queryKey: ["dashboard", "products"],
		queryFn: async () => getProducts(),
	});
	const usersQuery = useQuery({
		queryKey: ["dashboard", "users"],
		queryFn: async () => getUsers(),
		enabled: isAdmin,
		retry: false,
	});

	const products = productsQuery.data ?? [];
	const users = usersQuery.data ?? [];
	const adminCount = users.filter((u) => u.role === "admin").length;
	const isPending = productsQuery.isPending || (isAdmin && usersQuery.isPending);

	return (
		<DashboardShell
			title="Dashboard Overview"
			description="Real-time administration metrics, products inventory, and user privileges."
			actions={
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setCreateModalOpen(true)}
						size="sm"
						className="gap-1.5 font-medium shadow-sm"
					>
						<Plus className="size-4" /> Add Product
					</Button>
				</div>
			}
		>
			{/* Error Banners */}
			{(productsQuery.isError || (isAdmin && usersQuery.isError)) && (
				<div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
					<AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
					<div>
						{productsQuery.isError && (
							<p>Products error: {(productsQuery.error as Error).message}</p>
						)}
						{isAdmin && usersQuery.isError && (
							<p>Users error: {(usersQuery.error as Error).message}</p>
						)}
					</div>
				</div>
			)}

			{/* Metric Stat Cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Active Products"
					value={isPending ? "..." : products.length}
					subtitle="Total catalog items"
					icon={Package}
					color="text-teal-600 dark:text-teal-400"
				/>
				<StatCard
					title="Registered Users"
					value={!isAdmin ? "Admin Only" : isPending ? "..." : users.length}
					subtitle={!isAdmin ? "Requires Administrator role" : "Accounts in memory"}
					icon={Users}
					color="text-sky-600 dark:text-sky-400"
				/>
				<StatCard
					title="Administrators"
					value={!isAdmin ? "Admin Only" : isPending ? "..." : adminCount}
					subtitle={!isAdmin ? "Requires Administrator role" : "Privileged role holders"}
					icon={ShieldCheck}
					color="text-emerald-600 dark:text-emerald-400"
				/>
			</div>

			{/* Feature Cards Grid */}
			<div className="grid gap-5 md:grid-cols-2">
				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm transition hover:shadow-md">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
								<Package className="size-5" />
							</div>
							<div>
								<h2 className="text-base font-bold text-[var(--sea-ink)]">Product Management</h2>
								<p className="text-xs text-[var(--sea-ink-soft)]">
									View, search, create, update, or remove catalog items.
								</p>
							</div>
						</div>
					</div>

					<div className="mt-5 space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--sea-ink-soft)]">
						<div className="flex items-center justify-between">
							<span>Sample Inventory:</span>
							<span className="font-semibold text-[var(--sea-ink)]">{products.length} items</span>
						</div>
						<div className="flex items-center justify-between">
							<span>Image Limit:</span>
							<span className="font-semibold text-[var(--sea-ink)]">Max 512px client & server</span>
						</div>
					</div>

					<div className="mt-5 flex items-center justify-between pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCreateModalOpen(true)}
							className="gap-1.5 text-xs"
						>
							<Plus className="size-3.5" /> Quick Add
						</Button>
						<Link
							to="/products"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sea-ink)] hover:underline"
						>
							Explore products <ArrowRight className="size-3.5" />
						</Link>
					</div>
				</div>

				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm transition hover:shadow-md">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
								<Users className="size-5" />
							</div>
							<div>
								<h2 className="text-base font-bold text-[var(--sea-ink)]">User Administration</h2>
								<p className="text-xs text-[var(--sea-ink-soft)]">
									Manage member accounts, permissions, and administrator roles.
								</p>
							</div>
						</div>
					</div>

					<div className="mt-5 space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--sea-ink-soft)]">
						<div className="flex items-center justify-between">
							<span>Security Safeguard:</span>
							<span className="font-semibold text-[var(--sea-ink)]">Self-demotion blocked</span>
						</div>
						<div className="flex items-center justify-between">
							<span>Last-Admin Protection:</span>
							<span className="font-semibold text-[var(--sea-ink)]">Active (Lockout proof)</span>
						</div>
					</div>

					<div className="mt-5 flex items-center justify-between pt-2">
						<Link
							to="/setup"
							className="inline-flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							<Database className="size-3.5" /> Seed / Reset
						</Link>
						<Link
							to="/users"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sea-ink)] hover:underline"
						>
							Manage users <ArrowRight className="size-3.5" />
						</Link>
					</div>
				</div>
			</div>

			{/* Product Modal */}
			<ProductFormModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				onSuccess={() => productsQuery.refetch()}
			/>
		</DashboardShell>
	);
}

function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	color,
}: {
	title: string;
	value: string | number;
	subtitle: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}) {
	return (
		<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<p className="text-xs font-medium text-[var(--sea-ink-soft)]">{title}</p>
				<Icon className={`size-4.5 ${color}`} />
			</div>
			<p className="mt-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">{value}</p>
			<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{subtitle}</p>
		</div>
	);
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import {
	AlertCircle,
	CheckCircle2,
	Search,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	User as UserIcon,
	Users as UsersIcon,
	XCircle,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { UserRoleModal } from "@/components/UserRoleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";
import { deleteUser, getUsers } from "@/lib/server/users";

type UserRow = {
	id: string;
	email: string;
	name: string | null;
	role: Role;
	emailVerified: boolean;
	createdAt: string;
};

export const Route = createFileRoute("/users/")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			return redirect({ to: "/login" }) as any;
		}
	},
	component: UsersPage,
});

function UsersPage() {
	const queryClient = useQueryClient();
	const deleteFn = useServerFn(deleteUser);
	const { data: session } = authClient.useSession();

	const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
	const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRow | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: async () => getUsers(),
	});

	const allUsers = (usersQuery.data ?? []) as UserRow[];
	const filteredUsers = allUsers.filter(
		(u) =>
			u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			Boolean(u.name?.toLowerCase().includes(searchTerm.toLowerCase())),
	);

	const currentUserId = session?.user?.id;
	const adminCount = allUsers.filter((u) => u.role === "admin").length;

	const features = tableFeatures({});
	const columnHelper = createColumnHelper<typeof features, UserRow>();

	const columns = columnHelper.columns([
		columnHelper.accessor("name", {
			header: "User",
			cell: (info) => {
				const user = info.row.original;
				return (
					<div className="flex items-center gap-3">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] border border-[var(--line)] text-xs font-bold text-[var(--sea-ink)]">
							{user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-3.5" />}
						</div>
						<div>
							<p className="font-semibold text-[var(--sea-ink)]">{user.name || "Anonymous User"}</p>
							<p className="text-xs text-[var(--sea-ink-soft)]">{user.email}</p>
						</div>
					</div>
				);
			},
		}),
		columnHelper.accessor("role", {
			header: "Role",
			cell: (info) => {
				const role = info.getValue() as Role;
				const isSelf = info.row.original.id === currentUserId;

				return (
					<div className="flex items-center gap-2">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
								role === "admin"
									? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
									: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
							}`}
						>
							{role === "admin" ? (
								<ShieldCheck className="size-3 text-emerald-600" />
							) : (
								<UserIcon className="size-3 text-slate-500" />
							)}
							{role === "admin" ? "Administrator" : "User"}
						</span>
						{isSelf && (
							<span className="text-[10px] font-medium text-[var(--sea-ink-soft)] bg-[var(--chip-bg)] px-1.5 py-0.5 rounded border border-[var(--line)]">
								You
							</span>
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor("emailVerified", {
			header: "Status",
			cell: (info) => (
				<span className="inline-flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
					{info.getValue() ? (
						<>
							<CheckCircle2 className="size-3.5 text-emerald-600" /> Verified
						</>
					) : (
						<>
							<XCircle className="size-3.5 text-amber-500" /> Unverified
						</>
					)}
				</span>
			),
		}),
		columnHelper.accessor("createdAt", {
			header: "Joined",
			cell: (info) => (
				<span className="text-xs text-[var(--sea-ink-soft)]">
					{new Date(info.getValue() as string).toLocaleDateString()}
				</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				const user = info.row.original;
				const isSelf = user.id === currentUserId;
				const isLastAdmin = user.role === "admin" && adminCount <= 1;

				return (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="xs"
							onClick={() => setRoleModalUser(user)}
							className="h-7 text-xs"
						>
							Manage Role
						</Button>

						{isSelf ? (
							<span
								className="text-[11px] text-[var(--sea-ink-soft)] italic"
								title="Cannot delete active account"
							>
								Current Account
							</span>
						) : isLastAdmin ? (
							<span
								className="text-[11px] text-amber-700 dark:text-amber-400 font-medium"
								title="Cannot remove last administrator"
							>
								Last Admin
							</span>
						) : (
							<Button
								variant="ghost"
								size="xs"
								onClick={() => {
									setDeleteError(null);
									setDeleteConfirmUser(user);
								}}
								className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
							>
								<Trash2 className="size-3" /> Delete
							</Button>
						)}
					</div>
				);
			},
		}),
	]);

	const table = useTable({
		features,
		columns,
		data: filteredUsers,
	});

	const handleDelete = async (userId: string) => {
		setDeleting(true);
		setDeleteError(null);
		try {
			await deleteFn({ data: { userId } });
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			setDeleteConfirmUser(null);
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete user.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<DashboardShell
			title="User Management"
			description="Audit registered users, manage administrative roles, and enforce security policies."
		>
			{/* Search Toolbar */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-2.5 size-4 text-[var(--sea-ink-soft)]" />
					<Input
						placeholder="Search by name or email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<div className="flex items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
					<span>Total: {allUsers.length} users</span>
					<span>•</span>
					<span>Admins: {adminCount}</span>
				</div>
			</div>

			{/* Error State */}
			{usersQuery.isError && (
				<div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
					<AlertCircle className="size-4 shrink-0" />
					<span>Failed to load users: {(usersQuery.error as Error).message}</span>
				</div>
			)}

			{/* Loading State */}
			{usersQuery.isPending && (
				<div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6">
					<div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
					<div className="h-10 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
					<div className="h-10 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
				</div>
			)}

			{/* Users Table */}
			{!usersQuery.isPending && (
				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm overflow-hidden">
					{filteredUsers.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]">
								<UsersIcon className="size-7 opacity-50" />
							</div>
							<h3 className="mt-3 text-base font-bold text-[var(--sea-ink)]">
								{searchTerm ? "No matching users found" : "No users yet"}
							</h3>
							<p className="mt-1 text-xs text-[var(--sea-ink-soft)] max-w-sm">
								{searchTerm
									? "Try searching for a different keyword."
									: "No users have registered yet. Visit /setup to seed the administrator."}
							</p>
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

			{/* Role Modal */}
			<UserRoleModal
				open={Boolean(roleModalUser)}
				onOpenChange={(open) => !open && setRoleModalUser(null)}
				user={roleModalUser}
				currentUserId={currentUserId}
				onSuccess={() => usersQuery.refetch()}
			/>

			{/* Delete Confirmation Modal */}
			{deleteConfirmUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
					<div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-2xl space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
								<Trash2 className="size-5" />
							</div>
							<div>
								<h4 className="text-base font-bold text-[var(--sea-ink)]">Delete User Account</h4>
								<p className="text-xs text-[var(--sea-ink-soft)]">
									Permanently delete <strong>{deleteConfirmUser.email}</strong>?
								</p>
							</div>
						</div>

						{deleteError && (
							<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
								<ShieldAlert className="size-4 shrink-0" />
								<span>{deleteError}</span>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDeleteConfirmUser(null)}
								disabled={deleting}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleDelete(deleteConfirmUser.id)}
								disabled={deleting}
							>
								{deleting ? "Deleting..." : "Delete User"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</DashboardShell>
	);
}

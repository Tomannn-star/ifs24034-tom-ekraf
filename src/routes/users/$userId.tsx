import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	ArrowLeft,
	CheckCircle2,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";
import { deleteUser, getUsers, updateUserRole } from "@/lib/server/users";

export const Route = createFileRoute("/users/$userId")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			return redirect({ to: "/login" }) as any;
		}
	},
	component: UserDetailPage,
});

function UserDetailPage() {
	const { userId } = useParams({
		from: "/users/$userId",
	});
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const updateRoleFn = useServerFn(updateUserRole);
	const deleteFn = useServerFn(deleteUser);
	const { data: session } = authClient.useSession();

	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: async () => getUsers(),
	});

	const user = usersQuery.data?.find((u) => u.id === userId);
	const [localRole, setLocalRole] = useState<Role>(user?.role ?? "user");
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [deleting, setDeleting] = useState(false);

	const isSelf = session?.user?.id === userId;
	const adminCount = usersQuery.data?.filter((u) => u.role === "admin").length ?? 0;
	const isLastAdmin = user?.role === "admin" && adminCount <= 1;

	useEffect(() => {
		if (user) {
			setLocalRole(user.role);
		}
	}, [user]);

	if (usersQuery.isPending) {
		return (
			<DashboardShell title="User Profile">
				<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading user details...
				</div>
			</DashboardShell>
		);
	}

	if (!user) {
		return (
			<DashboardShell title="User Not Found">
				<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)] space-y-3">
					<p>The requested user does not exist or has been removed.</p>
					<Link to="/users" className="text-xs font-semibold text-[var(--sea-ink)] underline">
						Return to users
					</Link>
				</div>
			</DashboardShell>
		);
	}

	const handleRoleChange = async (next: Role) => {
		if (next === localRole) return;
		setMessage(null);

		if (isSelf && next !== "admin") {
			setMessage({
				type: "error",
				text: "Security restriction: You cannot demote your own administrator account.",
			});
			return;
		}

		try {
			await updateRoleFn({ data: { userId, role: next } });
			setLocalRole(next);
			setMessage({ type: "success", text: "Role updated successfully." });
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		} catch (err) {
			setMessage({
				type: "error",
				text: err instanceof Error ? err.message : "Role update failed.",
			});
		}
	};

	const handleDelete = async () => {
		if (isSelf) {
			setMessage({
				type: "error",
				text: "Security violation: You cannot delete your own account.",
			});
			return;
		}
		if (isLastAdmin) {
			setMessage({
				type: "error",
				text: "Lockout prevention: Cannot delete the last administrator.",
			});
			return;
		}
		if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) {
			return;
		}

		setDeleting(true);
		try {
			await deleteFn({ data: { userId } });
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await navigate({ to: "/users" });
		} catch (err) {
			setMessage({
				type: "error",
				text: err instanceof Error ? err.message : "Delete failed.",
			});
			setDeleting(false);
		}
	};

	return (
		<DashboardShell
			title="User Details"
			description="Manage account credentials, role privilege level, and lifecycle status."
		>
			<div className="max-w-2xl">
				<div className="mb-4">
					<Link
						to="/users"
						className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
					>
						<ArrowLeft className="size-3.5" /> Back to Users
					</Link>
				</div>

				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm sm:p-8 space-y-6">
					{message && (
						<div
							className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium ${
								message.type === "success"
									? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
									: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
							}`}
						>
							{message.type === "success" ? (
								<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
							) : (
								<ShieldAlert className="size-4 shrink-0 text-red-600" />
							)}
							<span>{message.text}</span>
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
							<p className="text-xs text-[var(--sea-ink-soft)]">Full Name</p>
							<p className="mt-1 font-semibold text-[var(--sea-ink)]">
								{user.name || "Anonymous User"}
							</p>
						</div>

						<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
							<p className="text-xs text-[var(--sea-ink-soft)]">Email Address</p>
							<p className="mt-1 font-semibold text-[var(--sea-ink)] break-all">{user.email}</p>
						</div>

						<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
							<p className="text-xs text-[var(--sea-ink-soft)]">Account Verification</p>
							<div className="mt-1 flex items-center gap-1.5 font-medium text-xs">
								{user.emailVerified ? (
									<>
										<CheckCircle2 className="size-3.5 text-emerald-600" />
										<span className="text-emerald-700 dark:text-emerald-400">Verified</span>
									</>
								) : (
									<>
										<XCircle className="size-3.5 text-amber-500" />
										<span className="text-amber-700 dark:text-amber-400">Unverified</span>
									</>
								)}
							</div>
						</div>

						<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
							<p className="text-xs text-[var(--sea-ink-soft)]">Member Since</p>
							<p className="mt-1 font-semibold text-[var(--sea-ink)]">
								{new Date(user.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>

					{/* Role Selector Card */}
					<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-5 space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-bold text-[var(--sea-ink)] flex items-center gap-1.5">
									<ShieldCheck className="size-4 text-[var(--sea-ink)]" /> Assigned Role
								</h3>
								<p className="text-xs text-[var(--sea-ink-soft)]">
									Administrators have full read/write privileges and user role management.
								</p>
							</div>
							<select
								value={localRole}
								onChange={(e) => handleRoleChange(e.target.value as Role)}
								disabled={isSelf}
								className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)] focus:outline-none"
							>
								<option value="user">User</option>
								<option value="admin">Administrator</option>
							</select>
						</div>
						{isSelf && (
							<p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
								⚠️ You are modifying your own account. Self-demotion is restricted.
							</p>
						)}
					</div>

					{/* Actions Footer */}
					<div className="border-t border-[var(--line)] pt-4 flex items-center justify-between">
						<div>
							{isLastAdmin ? (
								<p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
									This account is the only administrator. Deletion disabled to prevent lockout.
								</p>
							) : isSelf ? (
								<p className="text-xs text-[var(--sea-ink-soft)]">
									You cannot delete your own logged-in account.
								</p>
							) : null}
						</div>

						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={deleting || isSelf || isLastAdmin}
							className="gap-1.5 text-xs"
						>
							<Trash2 className="size-3.5" /> {deleting ? "Deleting..." : "Delete User"}
						</Button>
					</div>
				</div>
			</div>
		</DashboardShell>
	);
}

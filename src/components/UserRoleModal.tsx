import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/db";
import { updateUserRole } from "@/lib/server/users";

interface UserRoleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: {
		id: string;
		email: string;
		name: string | null;
		role: Role;
	} | null;
	currentUserId?: string | null;
	onSuccess?: () => void;
}

export function UserRoleModal({
	open,
	onOpenChange,
	user,
	currentUserId,
	onSuccess,
}: UserRoleModalProps) {
	const queryClient = useQueryClient();
	const updateRoleFn = useServerFn(updateUserRole);

	const [selectedRole, setSelectedRole] = useState<Role>("user");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isSelf = Boolean(user && currentUserId && user.id === currentUserId);

	useEffect(() => {
		if (user) {
			setSelectedRole(user.role);
			setError(null);
		}
	}, [user]);

	if (!user) return null;

	const handleSave = async () => {
		setError(null);

		if (isSelf && selectedRole !== "admin") {
			setError("Security restriction: You cannot demote your own administrator account.");
			return;
		}

		setLoading(true);
		try {
			await updateRoleFn({
				data: {
					userId: user.id,
					role: selectedRole,
				},
			});
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update role.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold">
						<ShieldCheck className="size-5 text-[var(--sea-ink)]" />
						Change User Role
					</DialogTitle>
					<DialogDescription>
						Update access level for <strong className="text-[var(--sea-ink)]">{user.email}</strong>
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
						<span>{error}</span>
					</div>
				)}

				{isSelf && (
					<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
						<strong>Notice:</strong> This is your current active account. Admin privileges must be
						retained to prevent administrative lockout.
					</div>
				)}

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-[var(--sea-ink)]">Select Role</Label>
						<Select
							value={selectedRole}
							onValueChange={(val) => setSelectedRole(val as Role)}
							disabled={loading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="user">
									<div className="flex items-center gap-2">
										<User className="size-3.5 text-muted-foreground" />
										<span>Standard User (View products only)</span>
									</div>
								</SelectItem>
								<SelectItem value="admin">
									<div className="flex items-center gap-2">
										<ShieldCheck className="size-3.5 text-emerald-600" />
										<span>Administrator (Full CRUD & Role control)</span>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={loading || (isSelf && selectedRole !== "admin")}
					>
						{loading ? (
							<>
								<Loader2 className="mr-1.5 size-4 animate-spin" /> Saving...
							</>
						) : (
							"Update Role"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

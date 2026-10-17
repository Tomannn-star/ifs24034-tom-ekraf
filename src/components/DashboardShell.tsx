import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChevronLeft,
	ChevronRight,
	Database,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	ShieldCheck,
	User as UserIcon,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import ThemeToggle from "./ThemeToggle";

interface DashboardShellProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	actions?: React.ReactNode;
}

export function DashboardShell({ children, title, description, actions }: DashboardShellProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const { data: session } = authClient.useSession();
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	const navItems = [
		{
			label: "Dashboard",
			href: "/dashboard",
			icon: LayoutDashboard,
		},
		{
			label: "Products",
			href: "/products",
			icon: Package,
		},
		{
			label: "Users",
			href: "/users",
			icon: Users,
		},
	];

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/login";
	};

	const userEmail = session?.user?.email ?? "User";
	const isAdmin = userEmail === "admin@example.com";

	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full">
			{/* Mobile Drawer Backdrop */}
			{mobileOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click to dismiss mobile menu
				<div
					onClick={() => setMobileOpen(false)}
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
				/>
			)}

			{/* Sidebar Container */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--line)] bg-[var(--surface-strong)] transition-all duration-300 md:static ${
					collapsed ? "md:w-20" : "md:w-64"
				} ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}`}
			>
				{/* Top Branding / Mobile Close */}
				<div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-4">
					<Link
						to="/"
						className={`flex items-center gap-2.5 font-bold text-[var(--sea-ink)] no-underline ${
							collapsed ? "md:justify-center md:w-full" : ""
						}`}
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#56c6be,#2f6a4a)] text-white shadow-sm font-black text-sm">
							EK
						</span>
						{(!collapsed || mobileOpen) && (
							<span className="text-sm font-bold tracking-tight">Ekraf Admin</span>
						)}
					</Link>

					{/* Mobile Close Button */}
					<button
						type="button"
						onClick={() => setMobileOpen(false)}
						className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] md:hidden"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Nav Links */}
				<div className="flex-1 space-y-1.5 px-3 py-4">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = currentPath.startsWith(item.href);

						return (
							<Link
								key={item.href}
								to={item.href}
								onClick={() => setMobileOpen(false)}
								className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
									isActive
										? "bg-[var(--sea-ink)] text-white shadow-sm"
										: "text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]"
								} ${collapsed ? "md:justify-center md:px-2" : ""}`}
								title={collapsed ? item.label : undefined}
							>
								<Icon className="size-5 shrink-0" />
								{(!collapsed || mobileOpen) && <span>{item.label}</span>}
							</Link>
						);
					})}
				</div>

				{/* Bottom User & Controls */}
				<div className="border-t border-[var(--line)] p-3 space-y-2">
					<Link
						to="/setup"
						className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)] transition-colors ${
							collapsed ? "md:justify-center md:px-2" : ""
						}`}
						title={collapsed ? "Setup & Seed" : undefined}
					>
						<Database className="size-4 shrink-0 text-emerald-600" />
						{(!collapsed || mobileOpen) && <span>Database / Setup</span>}
					</Link>

					{/* User Pill */}
					{session?.user && (
						<div
							className={`flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-2 ${
								collapsed ? "md:justify-center" : ""
							}`}
						>
							<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--sea-ink)] text-xs font-bold text-white">
								{session.user.name?.charAt(0).toUpperCase() || <UserIcon className="size-3.5" />}
							</div>
							{(!collapsed || mobileOpen) && (
								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-semibold text-[var(--sea-ink)]">
										{session.user.name || "User"}
									</p>
									<div className="flex items-center gap-1 text-[11px] text-[var(--sea-ink-soft)]">
										{isAdmin && <ShieldCheck className="size-3 text-emerald-600" />}
										<span className="truncate">{userEmail}</span>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Sign Out & Theme & Collapse */}
					<div className="flex items-center justify-between gap-1 pt-1">
						{(!collapsed || mobileOpen) && (
							<button
								type="button"
								onClick={handleSignOut}
								className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
							>
								<LogOut className="size-3.5" />
								<span>Sign out</span>
							</button>
						)}

						<div className="flex items-center gap-1">
							<ThemeToggle />
							{/* Desktop Collapse Toggle */}
							<button
								type="button"
								onClick={() => setCollapsed(!collapsed)}
								className="hidden md:flex size-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)] transition-colors"
								title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
							>
								{collapsed ? (
									<ChevronRight className="size-4" />
								) : (
									<ChevronLeft className="size-4" />
								)}
							</button>
						</div>
					</div>
				</div>
			</aside>

			{/* Main Workspace Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Top Mobile Bar */}
				<header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--surface-strong)] px-4 md:hidden">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setMobileOpen(true)}
							className="rounded-lg p-1.5 text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							aria-label="Open sidebar"
						>
							<Menu className="size-5" />
						</button>
						<span className="text-sm font-bold text-[var(--sea-ink)]">
							{title || "Admin Dashboard"}
						</span>
					</div>
					<ThemeToggle />
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
					<div className="mx-auto max-w-6xl space-y-6">
						{(title || actions) && (
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
								<div>
									{title && (
										<h1 className="display-title text-2xl sm:text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
											{title}
										</h1>
									)}
									{description && (
										<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{description}</p>
									)}
								</div>
								{actions && <div className="flex items-center gap-2">{actions}</div>}
							</div>
						)}
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

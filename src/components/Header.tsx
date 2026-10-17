import { Link } from "@tanstack/react-router";
import BetterAuthHeader from "../integrations/better-auth/header-user.tsx";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 sm:py-4">
				<div className="flex items-center gap-6">
					<h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
						<Link
							to="/"
							className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-bold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
						>
							<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
							TanStack Ekraf
						</Link>
					</h2>

					<div className="hidden md:flex items-center gap-1 text-sm font-medium">
						<Link
							to="/"
							className="rounded-lg px-3 py-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							activeProps={{ className: "font-semibold text-[var(--sea-ink)] bg-[var(--chip-bg)]" }}
						>
							Home
						</Link>
						<Link
							to="/dashboard"
							className="rounded-lg px-3 py-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							activeProps={{ className: "font-semibold text-[var(--sea-ink)] bg-[var(--chip-bg)]" }}
						>
							Dashboard
						</Link>
						<Link
							to="/products"
							className="rounded-lg px-3 py-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							activeProps={{ className: "font-semibold text-[var(--sea-ink)] bg-[var(--chip-bg)]" }}
						>
							Products
						</Link>
						<Link
							to="/users"
							className="rounded-lg px-3 py-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							activeProps={{ className: "font-semibold text-[var(--sea-ink)] bg-[var(--chip-bg)]" }}
						>
							Users
						</Link>
						<Link
							to="/setup"
							className="rounded-lg px-3 py-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)]"
							activeProps={{ className: "font-semibold text-[var(--sea-ink)] bg-[var(--chip-bg)]" }}
						>
							Setup
						</Link>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<BetterAuthHeader />
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}

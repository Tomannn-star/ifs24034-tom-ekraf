import { Link, createFileRoute } from "@tanstack/react-router";

import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<main className="page-wrap px-4 py-12">
				<p className="text-[var(--sea-ink-soft)]">Loading session...</p>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 py-12">
			<section className="island-shell rounded-2xl p-6 sm:p-8">
				<p className="island-kicker mb-2">Ekraf Dashboard</p>
				<h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
					Admin Dashboard
				</h1>
				<p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
					Secure product and user administration backed by Better Auth and TanStack Start.
				</p>

				{session?.user ? (
					<div className="mt-8 flex flex-wrap gap-4">
						<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
							<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
								Signed in as <span className="font-semibold">{session.user.email}</span>
							</p>
							<p className="m-0 mt-1 text-xs text-[var(--sea-ink-soft)]">
								{session.user.email === "admin@example.com" ? "Administrator" : "User"}
							</p>
						</div>
						<Link
							to="/dashboard"
							className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
						>
							Open Dashboard
						</Link>
					</div>
				) : (
					<div className="mt-8 flex flex-wrap gap-4">
						<Link
							to="/login"
							className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
						>
							Sign in / Sign up
						</Link>
						<p className="m-0 mt-3 sm:mt-0 text-sm text-[var(--sea-ink-soft)]">
							Create an account, then{" "}
							<Link
								to="/setup"
								className="underline underline-offset-4 font-medium hover:text-[var(--sea-ink)]"
							>
								seed the admin account
							</Link>
							to unlock product and user CRUD.
						</p>
					</div>
				)}
			</section>
		</main>
	);
}

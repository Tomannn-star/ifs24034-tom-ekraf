import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Lock, LogIn, Mail, ShieldAlert, Sparkles, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getServerSession } from "@/lib/server/auth";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (session) {
			return redirect({ to: "/dashboard" }) as any;
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!email.trim() || !password) {
			setError("Please fill in both email and password.");
			return;
		}

		if (mode === "signup" && !name.trim()) {
			setError("Please enter your name.");
			return;
		}

		setLoading(true);

		try {
			if (mode === "signin") {
				const res = await authClient.signIn.email({
					email: email.trim(),
					password,
				});
				if (res.error) {
					setError(
						res.error.message || "Invalid credentials. Please verify your email and password.",
					);
					setLoading(false);
					return;
				}
			} else {
				const res = await authClient.signUp.email({
					email: email.trim(),
					password,
					name: name.trim(),
				});
				if (res.error) {
					setError(res.error.message || "Sign up failed. Please try again.");
					setLoading(false);
					return;
				}
			}

			// Successful auth
			await navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page-wrap flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				{/* Brand Header */}
				<div className="mb-6 text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)] shadow-sm">
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						Ekraf Admin Portal
					</div>
					<h1 className="display-title mt-3 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
						{mode === "signin" ? "Sign in to Dashboard" : "Create an Account"}
					</h1>
					<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
						{mode === "signin"
							? "Enter your credentials to access the administration panel"
							: "Register an account to explore the dashboard"}
					</p>
				</div>

				{/* Card */}
				<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-xl backdrop-blur-md sm:p-8">
					{error && (
						<div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
							<ShieldAlert className="mt-0.5 size-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{mode === "signup" && (
							<div className="space-y-1.5">
								<Label htmlFor="name" className="text-xs font-semibold text-[var(--sea-ink)]">
									Full Name
								</Label>
								<div className="relative">
									<User className="absolute left-3 top-2.5 size-4 text-[var(--sea-ink-soft)]" />
									<Input
										id="name"
										type="text"
										placeholder="e.g. Jane Doe"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="pl-9"
										required={mode === "signup"}
										disabled={loading}
									/>
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="email" className="text-xs font-semibold text-[var(--sea-ink)]">
								Email Address
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-2.5 size-4 text-[var(--sea-ink-soft)]" />
								<Input
									id="email"
									type="email"
									placeholder="admin@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="pl-9"
									required
									disabled={loading}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="text-xs font-semibold text-[var(--sea-ink)]">
									Password
								</Label>
							</div>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 size-4 text-[var(--sea-ink-soft)]" />
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="pl-9"
									required
									disabled={loading}
								/>
							</div>
						</div>

						<Button type="submit" disabled={loading} className="w-full gap-2 font-medium">
							{loading ? (
								"Processing..."
							) : mode === "signin" ? (
								<>
									<LogIn className="size-4" /> Sign In
								</>
							) : (
								<>
									<Sparkles className="size-4" /> Create Account
								</>
							)}
						</Button>
					</form>

					<div className="mt-6 border-t border-[var(--line)] pt-4 text-center">
						<button
							type="button"
							onClick={() => {
								setError(null);
								setMode(mode === "signin" ? "signup" : "signin");
							}}
							className="text-xs font-medium text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:underline"
						>
							{mode === "signin"
								? "Don't have an account yet? Create one"
								: "Already have an account? Sign in here"}
						</button>
					</div>
				</div>

				{/* Dev Seed Reminder */}
				<div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 text-center text-xs text-[var(--sea-ink-soft)]">
					<p className="m-0">
						Need the initial administrator credentials?{" "}
						<Link
							to="/setup"
							className="font-semibold text-[var(--sea-ink)] underline underline-offset-4"
						>
							Run one-time seed (/setup)
						</Link>
					</p>
					<p className="mt-1 text-[11px] opacity-80">
						Default seed: admin@example.com / admin12345
					</p>
				</div>
			</div>
		</main>
	);
}

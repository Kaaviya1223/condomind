import Link from "next/link";
import { ClipboardList, Sparkles, Users } from "lucide-react";
import { Flash } from "@/components/flash";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass } from "@/components/ui";
import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: { mode?: string; error?: string; message?: string };
};

const FEATURES = [
  { icon: ClipboardList, text: "Residents report problems in seconds and follow every step" },
  { icon: Sparkles, text: "Each request gets a suggested category, priority and next steps" },
  { icon: Users, text: "Units, owners, tenants and vendors in one place" },
];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const isSignup = searchParams.mode === "signup";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[45%] flex-col justify-between bg-indigo-600 p-12 text-white lg:flex">
        <Logo inverted href="/login" />
        <div className="max-w-md space-y-8">
          <h2 className="text-3xl font-semibold leading-tight">
            Condo management that keeps everyone in the loop.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-indigo-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="pt-1 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-indigo-200">For building managers, owners and tenants.</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo href="/login" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-500">
              {isSignup
                ? "Use the email your building manager has on file, so we can link you to your unit."
                : "Log in to manage your building or follow your requests."}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <Link
              href="/login"
              className={`rounded-md py-2 text-center ${!isSignup ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className={`rounded-md py-2 text-center ${isSignup ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign up
            </Link>
          </div>

          <Flash searchParams={searchParams} />

          <form action={isSignup ? signup : login} className="space-y-5">
            {isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="full_name" className={labelClass}>Full name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className={inputClass}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={6}
                required
                className={inputClass}
              />
              {isSignup && <p className="text-xs text-slate-500">At least 6 characters.</p>}
            </div>
            <SubmitButton
              label={isSignup ? "Create account" : "Log in"}
              pendingLabel={isSignup ? "Creating account..." : "Logging in..."}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            />
          </form>
        </div>
      </main>
    </div>
  );
}

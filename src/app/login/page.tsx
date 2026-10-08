import Link from "next/link";
import { login, signup } from "./actions";
import { SubmitButton } from "@/components/submit-button";

type LoginPageProps = {
  searchParams: { mode?: string; error?: string; message?: string };
};

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none";

export default function LoginPage({ searchParams }: LoginPageProps) {
  const isSignup = searchParams.mode === "signup";

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">
        {isSignup ? "Create your account" : "Log in to CondoMind"}
      </h1>

      {searchParams.error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {searchParams.message && (
        <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">
          {searchParams.message}
        </p>
      )}

      <form action={isSignup ? signup : login} className="mt-6 space-y-4">
        {isSignup && (
          <div className="space-y-1">
            <label htmlFor="full_name" className="block text-sm font-medium">
              Full name
            </label>
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
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
            required
            className={inputClass}
          />
        </div>
        <SubmitButton
          label={isSignup ? "Sign up" : "Log in"}
          pendingLabel={isSignup ? "Signing up..." : "Logging in..."}
          className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
        />
      </form>

      <p className="mt-6 text-sm text-gray-600">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to CondoMind?{" "}
            <Link href="/login?mode=signup" className="font-medium underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </main>
  );
}

import Link from "next/link";
import { Building } from "lucide-react";

export function Logo({ href = "/", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          inverted ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
        }`}
      >
        <Building className="h-5 w-5" />
      </span>
      <span className={`text-lg font-semibold tracking-tight ${inverted ? "text-white" : "text-slate-900"}`}>
        CondoMind
      </span>
    </Link>
  );
}

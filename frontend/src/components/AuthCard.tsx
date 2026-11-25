import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-stone-50 to-teal-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/home" className="text-sm font-medium tracking-wide text-rose-700">
          SPA BOOKING
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

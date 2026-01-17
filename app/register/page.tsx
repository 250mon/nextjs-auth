import CompanyLogo from "@/app/ui/company-logo";
import RegisterForm from "@/app/ui/auth/register-form";
import { Suspense } from "react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <CompanyLogo variant="compact" />
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

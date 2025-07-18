import { Headphones } from "lucide-react";

import { SigninForm } from "@/components/auth/signin-from";
import { UnauthenticatedGuard } from "@/components/auth/unauthenticated-guard";
export const metadata = {
  title: "Sign In | Chaos",
};

export default function SigninPage() {
  return (
    <UnauthenticatedGuard>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <Headphones className="size-4" />
              </div>
              Chaos
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SigninForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://img.freepik.com/premium-photo/background-with-colorful-pattern-texture-abstract-wave_1103290-42578.jpg"
            alt="Image"
            className="h-full w-full object-cover dark:brightness-[0.8] dark:grayscale"
          />
        </div>
      </div>
    </UnauthenticatedGuard>
  );
}

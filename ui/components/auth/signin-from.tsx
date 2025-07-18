"use client";
import { useAuthStore } from "@/components/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Signin } from "@/lib/api/auth";
import { signinSchema, SigninUser } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(signinSchema),
    mode: "onChange",
  });

  const { mutate, error, isPending } = useMutation({
    mutationFn: Signin,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      localStorage.setItem("authToken", data.token);
      router.replace("/");
    },
  });

  const onSubmit = (data: SigninUser) => {
    mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign In to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to signin to your account
        </p>

        {error && <p className="text-destructive text-sm">{error.message}</p>}
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...register("email")}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
          <Input
            id="password"
            type="password"
            required
            {...register("password")}
          />
        </div>
        <Button type="submit" disabled={!isValid} className="w-full">
          {isPending ? <Loader2Icon className="animate-spin" /> : "Sign In"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  );
}

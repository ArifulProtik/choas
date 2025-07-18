"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CreateUser, signupSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckUsername, Signup } from "@/lib/api/auth";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateUser>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const watchedUsername = watch("username") || ""; // Fallback to empty string
  const [debouncedUsername] = useDebounce(watchedUsername, 1000); // Reduced to 500ms
  const {
    data: usernameCheck,
    isLoading,
    error: usernameError,
  } = useQuery({
    queryKey: ["checkusername", debouncedUsername], // Use debouncedUsername
    queryFn: () => CheckUsername(debouncedUsername),
    enabled:
      !errors.username && !!debouncedUsername && debouncedUsername.length > 3, // Run when debouncedUsername is valid
    staleTime: 2000,
  });

  const {
    mutateAsync,
    error: signupError,
    isPending,
  } = useMutation({
    mutationFn: Signup,
    onSuccess: () => {
      toast.success("Signup successful! You can now sign in.");
      router.push("/signin");
    },
  });

  const onSubmit = async (data: CreateUser) => {
    try {
      await mutateAsync(data);
    } catch {
      return;
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Get started</CardTitle>
          <CardDescription>
            Enter your details to create an account.
          </CardDescription>
          {signupError && (
            <p className="text-destructive text-sm">{signupError.message}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                {errors.name && (
                  <p className="text-destructive text-sm transition-all">
                    {errors.name.message}
                  </p>
                )}
                <Input
                  id="name"
                  type="text"
                  placeholder="Jhon Doe"
                  required
                  {...register("name")}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
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
                <Label htmlFor="username">Username</Label>
                {errors.username && (
                  <p className="text-destructive text-xs">
                    {errors.username.message}
                  </p>
                )}
                {usernameError && (
                  <p className="text-destructive text-xs">
                    {usernameError.message}
                  </p>
                )}
                {usernameCheck && !isLoading && (
                  <p className="text-green-700 text-xs">
                    Username is available
                  </p>
                )}
                {isLoading && debouncedUsername.length > 3 && (
                  <p className="text-muted-foreground text-xs">
                    Checking availability...
                  </p>
                )}
                <Input
                  id="username"
                  type="text"
                  placeholder=""
                  required
                  {...register("username")}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  required
                  {...register("password")}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                {errors.confirm_password && (
                  <p className="text-destructive text-sm">
                    {errors.confirm_password.message}
                  </p>
                )}
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder=""
                  required
                  {...register("confirm_password")}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={!isValid} className="w-full">
                  {isSubmitting && isPending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link className="underline font-bold" href={"/signin"}>
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

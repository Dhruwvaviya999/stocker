"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, TriangleAlert, Check, ChevronsUpDown } from "lucide-react";

import {
  companyLoginSchema,
  type CompanyLoginInput,
} from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axios";

interface CompanyOption {
  id: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompanyLoginInput>({
    resolver: zodResolver(companyLoginSchema),
    defaultValues: { companyId: "", identifier: "", password: "" },
  });

  useEffect(() => {
    let active = true;
    axiosInstance
      .get<{ data: CompanyOption[] }>("/companies/options")
      .then((res) => {
        if (active) setCompanies(res.data.data ?? []);
      })
      .catch(() => {
        if (active) setServerError("Couldn't load companies. Refresh to retry.");
      })
      .finally(() => {
        if (active) setLoadingCompanies(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(data: CompanyLoginInput) {
    setServerError(null);

    const result = await signIn("company-login", {
      companyId: data.companyId,
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Those details don't match an account. Check and retry.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Choose your company and sign in to continue.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {/* Company selector */}
          <Field data-invalid={!!errors.companyId}>
            <FieldLabel htmlFor="company-trigger">Company</FieldLabel>
            <Controller
              control={control}
              name="companyId"
              render={({ field }) => {
                const selected = companies.find((c) => c.id === field.value);
                return (
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="company-trigger"
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={companyOpen}
                        aria-invalid={!!errors.companyId}
                        disabled={loadingCompanies}
                        className="w-full justify-between font-normal"
                      >
                        <span
                          className={cn(!selected && "text-muted-foreground")}
                        >
                          {loadingCompanies
                            ? "Loading companies…"
                            : selected
                              ? selected.name
                              : "Select your company"}
                        </span>
                        <ChevronsUpDown className="size-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search company…" />
                        <CommandList>
                          <CommandEmpty>No company found.</CommandEmpty>
                          <CommandGroup>
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => {
                                  field.onChange(company.id);
                                  setCompanyOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    field.value === company.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {company.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                );
              }}
            />
            <FieldError
              errors={errors.companyId ? [errors.companyId] : undefined}
            />
          </Field>

          {/* Username or email */}
          <Field data-invalid={!!errors.identifier}>
            <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
            <Input
              id="identifier"
              placeholder="yourname or you@company.com"
              autoComplete="username"
              disabled={isSubmitting}
              aria-invalid={!!errors.identifier}
              {...register("identifier")}
            />
            <FieldError
              errors={errors.identifier ? [errors.identifier] : undefined}
            />
          </Field>

          {/* Password */}
          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <FieldError
              errors={errors.password ? [errors.password] : undefined}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        No account yet? Ask your company admin to create one for you.
      </p>
    </div>
  );
}
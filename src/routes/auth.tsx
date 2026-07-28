import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Car } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginSchema, registerSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or register — Torque Motors" },
      {
        name: "description",
        content:
          "Create a Torque Motors account or sign in to purchase vehicles and manage dealership inventory.",
      },
      { property: "og:title", content: "Sign in or register — Torque Motors" },
      {
        property: "og:description",
        content: "Account access for the Torque Motors dealership inventory system.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/" });
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName ?? "" },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're signed in");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:py-24">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Car className="size-6" />
        </span>
        <h1 className="font-display text-3xl font-bold">Torque Motors</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to purchase vehicles or manage the dealership inventory.
        </p>
      </div>

      <Card className="surface-panel">
        <Tabs defaultValue="login">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="grid gap-4">
                <CardTitle className="sr-only">Sign in</CardTitle>
                <CardDescription>Use the email and password you registered with.</CardDescription>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={update("password")}
                  />
                </div>
                <Button type="submit" disabled={loading} className="mt-2 w-full">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="grid gap-4">
                <CardDescription>
                  The first account created becomes the dealership administrator.
                </CardDescription>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-name">Full name</Label>
                  <Input id="register-name" value={form.fullName} onChange={update("fullName")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update("password")}
                  />
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <Button type="submit" disabled={loading} className="mt-2 w-full">
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </CardContent>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

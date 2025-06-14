
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type AuthPageMode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthPageMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const { signIn, signUp, loading, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (!loading && user) {
    navigate("/");
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Logged in!", description: "Welcome back." });
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email!", description: "We've sent a link to verify your email." });
      }
    }
    setPending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-50">
      <Card className="w-full max-w-md p-7">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email"
            required
            disabled={pending}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            required
            minLength={6}
            disabled={pending}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}
          </Button>
        </form>
        <div className="mt-5 text-sm text-center text-gray-600">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button className="underline text-blue-600" onClick={() => setMode("signup")}>Create an account</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="underline text-blue-600" onClick={() => setMode("login")}>Sign In</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

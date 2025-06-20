
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
    <div 
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/2450f682-9da7-405e-8c7d-ef5b072c1a0a.png')`,
        backgroundSize: '200px 200px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay to make background more subtle */}
      <div className="absolute inset-0 bg-white/80"></div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="/lovable-uploads/2450f682-9da7-405e-8c7d-ef5b072c1a0a.png" 
              alt="Godel Logo" 
              className="w-16 h-16 mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Godel</h1>
          <p className="text-gray-600 text-sm">
            {mode === "login" ? "Welcome back" : "Join us today"}
          </p>
        </div>

        <Card className="p-8 shadow-lg bg-white/95 backdrop-blur-sm border-0">
          <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              required
              disabled={pending}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 text-base"
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
              className="h-12 text-base"
            />
            <Button type="submit" disabled={pending} className="w-full h-12 text-base font-medium">
              {pending ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}
            </Button>
          </form>
          <div className="mt-6 text-sm text-center text-gray-600">
            {mode === "login" ? (
              <>
                New to Godel?{" "}
                <button 
                  className="text-blue-600 hover:text-blue-700 underline font-medium" 
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button 
                  className="text-blue-600 hover:text-blue-700 underline font-medium" 
                  onClick={() => setMode("login")}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

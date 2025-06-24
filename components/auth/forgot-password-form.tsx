'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // For sending reset

  const handleTry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setCanSubmit(false);

    // Try to find user by email or username
    const { data, error } = await supabase
      .from('profiles') // Adjust table name if needed
      .select('email')
      .or(`email.eq.${input},username.eq.${input}`)
      .single();

    if (error || !data) {
      setError("No account found with this email or username.");
    } else {
      setUserEmail(data.email); // Save for reset
      setCanSubmit(true);
      setMessage("Account found! Now you can reset your password.");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for the password reset link!");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email or username and click Try to see if you have an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={canSubmit ? handleSubmit : handleTry} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Email or Username</Label>
              <Input
                id="input"
                type="text"
                placeholder="Enter your email or username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
                disabled={isLoading || canSubmit}
              />
            </div>

            {error && <div className="text-sm text-red-600 text-center">{error}</div>}

            {message && <div className="text-sm text-green-600 text-center">{message}</div>}

            <Button type="submit" className="w-full" disabled={isLoading || !input}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {canSubmit ? "Submit" : "Try"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
                 }

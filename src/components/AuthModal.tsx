'use client'

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";
import { getBaseUrl } from "@/lib/runtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skull, Eye, EyeOff, Crown, Users } from "lucide-react";

interface AuthModalProps {
  trigger?: React.ReactNode;
}

const AuthModal = ({ trigger }: AuthModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      setIsOpen(false);
      toast({
        title: "Signed in",
        description: "You are signed in.",
      });
      setLoginData({ email: "", password: "" });
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: "Invalid credentials. Try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogle = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = getBaseUrl();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/')}` },
      });
    } catch (e) {
      toast({ title: 'Google sign-in failed', variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await register(registerData.email, registerData.password, registerData.name);
      setIsOpen(false);
      toast({
        title: "Account created",
        description: "Your account has been created.",
      });
      setRegisterData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Unable to create account. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-frost text-frost hover:bg-frost hover:text-background gothic-heading">
            <Skull className="h-4 w-4 mr-2" />
            Sign in
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="blackletter text-2xl text-bone text-center flex items-center justify-center">
            <Skull className="h-6 w-6 mr-2 text-accent" />
            Sign in or register
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="login" className="gothic-heading">Sign in</TabsTrigger>
            <TabsTrigger value="register" className="gothic-heading">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-bone">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="arg@obsidianriterecords.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-bone">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-secondary/50 border-border text-foreground pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-accent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gothic-heading"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
              <Button
                type="button"
                onClick={handleGoogle}
                className="w-full mt-2 justify-center bg-white text-black border border-border hover:bg-gray-100 dark:bg-background dark:text-foreground dark:hover:bg-secondary"
                aria-label="Continue with Google"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  className="mr-2"
                >
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C17.2 3 14.8 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.7H12z"/>
                  <path fill="#34A853" d="M3.9 7.3l3.2 2.4C7.8 8.3 9.7 6.9 12 6.9c1.9 0 3.2.8 3.9 1.5l2.6-2.5C17.2 3 14.8 2 12 2 8.5 2 5.5 3.8 3.9 7.3z"/>
                  <path fill="#FBBC05" d="M12 22c2.7 0 5-1 6.7-2.6l-3.1-2.6c-.8.5-1.9.9-3.6.9-2.8 0-5.1-1.9-5.9-4.5l-3.2 2.5C4.5 19.9 7.9 22 12 22z"/>
                  <path fill="#4285F4" d="M21.6 12.1c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.2 1.2-1.7 3.6-5.5 3.6-2.5 0-4.7-1.7-5.5-4.1l-3.2 2.5C4 19.9 7.5 22 12 22c5.8 0 9.6-4.1 9.6-9.9z"/>
                </svg>
                Continue with Google
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 p-4 bg-secondary/20 rounded border border-border">
              <p className="text-xs text-muted-foreground mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs">
                <p className="flex items-center"><Users className="h-3 w-3 mr-1 text-frost" /> arg@obsidianriterecords.com</p>
                <p className="flex items-center"><Crown className="h-3 w-3 mr-1 text-accent" /> arg@obsidianriterecords.com</p>
                <p className="text-muted-foreground">Password: anything</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name" className="text-bone">Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Your name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-bone">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="arg@obsidianriterecords.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-bone">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-bone">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gothic-heading"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

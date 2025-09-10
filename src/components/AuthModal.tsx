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

const AuthModal = () => {
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
        <Button variant="outline" className="border-frost text-frost hover:bg-frost hover:text-background gothic-heading">
          <Skull className="h-4 w-4 mr-2" />
          Sign in
        </Button>
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
              <Button type="button" onClick={handleGoogle} className="w-full mt-2" variant="outline">
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

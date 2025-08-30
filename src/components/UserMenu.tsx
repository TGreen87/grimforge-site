'use client'

import { useState } from "react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, Heart, Settings, LogOut, Crown, Users } from "lucide-react";

const UserMenu = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getUserIcon = () => {
    switch (user.role) {
      case "admin": return <Crown className="h-4 w-4 text-accent" />;
      case "wholesale": return <Users className="h-4 w-4 text-frost" />;
      default: return <User className="h-4 w-4 text-bone" />;
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case "admin": return "Admin";
      case "wholesale": return "Distributor";
      default: return "Cultist";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-secondary text-bone gothic-heading">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 bg-background border-border" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="gothic-heading text-sm text-bone">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-1">
              {getUserIcon()}
              <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem className="text-foreground hover:bg-secondary cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-foreground hover:bg-secondary cursor-pointer">
          <Package className="mr-2 h-4 w-4" />
          <span>Orders</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-foreground hover:bg-secondary cursor-pointer">
          <Heart className="mr-2 h-4 w-4" />
          <span>Wishlist</span>
        </DropdownMenuItem>
        
        {user.role === "wholesale" && (
          <DropdownMenuItem className="text-frost hover:bg-secondary cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Wholesale Portal</span>
          </DropdownMenuItem>
        )}
        
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link 
              href="/admin" 
              className="text-accent hover:bg-secondary cursor-pointer flex items-center w-full"
            >
              <Crown className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem className="text-foreground hover:bg-secondary cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          className="text-destructive hover:bg-destructive/10 cursor-pointer"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Banish from Realm</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
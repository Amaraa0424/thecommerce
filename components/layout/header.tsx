"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuSearch,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, ShoppingCart, Heart, Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { AuthModal } from "@/components/modals/auth-modal"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { useCart } from "@/contexts/cart-context"
import { useFavorites } from "@/contexts/favorites-context"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const { itemCount } = useCart()
  const { favoriteCount } = useFavorites()
  const { user, isAuthenticated, logout } = useAuth()
  
  const navigation = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
  ];

  const openAuthModal = useCallback((mode: "login" | "register") => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, []);

  const handleModeChange = useCallback((mode: "login" | "register") => {
    setAuthMode(mode)
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">ShopHub</span>
          </Link>

          {/* Desktop Navigation with Integrated Search */}
          <NavigationMenu className="hidden md:flex flex-1 max-w-4xl mx-8">
            <NavigationMenuList className="flex-1 justify-between">
              <div className="flex items-center space-x-1">
                {navigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 ${
                          pathname === item.href ? "bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        {item.name}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </div>
              <NavigationMenuItem className="flex-1 max-w-md ml-8">
                <NavigationMenuSearch />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:inline-flex"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/favorites">
                <Heart className="h-5 w-5" />
                {favoriteCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {favoriteCount}
                  </Badge>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* Cart */}
            <CartDrawer>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {itemCount}
                  </Badge>
                )}
                <span className="sr-only">Shopping cart</span>
              </Button>
            </CartDrawer>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites">Favorites</Link>
                    </DropdownMenuItem>
                    {user?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="text-orange-600 font-medium">
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/debug/session" className="text-blue-600 text-xs">
                            Debug Session
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => openAuthModal("login")}>
                    Sign In
                  </Button>
                  <Button onClick={() => openAuthModal("register")}>Sign Up</Button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Navigate through our store</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  {/* Mobile Search */}
                  <div className="relative">
                    <NavigationMenuSearch />
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="grid gap-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Auth Buttons */}
                  <div className="grid gap-2 pt-4 border-t">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                              <AvatarFallback>
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user?.name}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/profile">Profile</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/orders">Orders</Link>
                        </Button>
                        {user?.role === 'ADMIN' && (
                          <>
                            <Button variant="outline" asChild className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
                              <Link href="/admin">Admin Dashboard</Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                              <Link href="/debug/session">Debug Session</Link>
                            </Button>
                          </>
                        )}
                        <Button variant="outline" onClick={logout} className="w-full">
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => openAuthModal("login")} className="w-full">
                          Sign In
                        </Button>
                        <Button onClick={() => openAuthModal("register")} className="w-full">
                          Sign Up
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        mode={authMode}
        onModeChange={handleModeChange}
      />
    </header>
  )
}
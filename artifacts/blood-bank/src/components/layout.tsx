import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                ب
              </div>
              <span className="font-bold text-lg hidden sm:inline-block text-primary">بنك الدم - غريان</span>
            </Link>
            
            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <Link href="/" className={location === "/" ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}>الرئيسية</Link>
              <Link href="/blood-requests" className={location === "/blood-requests" ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}>طلبات الدم</Link>
              {isAuthenticated && user?.roles?.includes("Donor") && (
                <Link href="/donor/dashboard" className={location.startsWith("/donor") ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}>لوحة المتبرع</Link>
              )}
              {isAuthenticated && (user?.roles?.includes("Staff") || user?.roles?.includes("Admin")) && (
                <Link href="/staff/dashboard" className={location.startsWith("/staff") || location.startsWith("/admin") ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}>لوحة التحكم</Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">مرحباً، {user?.fullName || user?.userName}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>تسجيل الخروج</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">إنشاء حساب</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-6 md:py-0 bg-muted/40">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} مستشفى غريان المركزي - بنك الدم. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>للطوارئ: 1415</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

type NavItem = { href: string; label: string };

const staffNav: NavItem[] = [
  { href: "/staff/dashboard", label: "لوحة التحكم" },
  { href: "/staff/donations", label: "التبرعات" },
  { href: "/staff/donors", label: "المتبرعون" },
  { href: "/staff/blood-requests", label: "طلبات الدم" },
  { href: "/staff/patients", label: "المرضى" },
  { href: "/staff/inventory", label: "المخزون" },
];

const adminOnlyNav: NavItem[] = [
  { href: "/admin/users", label: "إدارة المستخدمين" },
];

const donorNav: NavItem[] = [
  { href: "/donor/dashboard", label: "لوحتي" },
  { href: "/donor/requests", label: "طلبات الدم" },
  { href: "/profile", label: "ملفي الشخصي" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const isStaff = user?.roles?.includes("Staff") || user?.roles?.includes("Admin");
  const isAdmin = user?.roles?.includes("Admin");
  const isDonor = user?.roles?.includes("Donor");

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const subNav = isStaff
    ? isAdmin
      ? [...staffNav, ...adminOnlyNav]
      : staffNav
    : isDonor
    ? donorNav
    : null;

  return (
    <div className="min-h-screen flex flex-col font-sans" dir="rtl">
      {/* Main header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                ب
              </div>
              <span className="font-bold text-base hidden sm:inline-block text-primary">بنك الدم - غريان</span>
            </Link>

            {!isAuthenticated && (
              <nav className="hidden md:flex gap-5 text-sm font-medium">
                <Link href="/" className={location === "/" ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary transition-colors"}>الرئيسية</Link>
                <Link href="/blood-requests" className={location === "/blood-requests" ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary transition-colors"}>طلبات الدم</Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {user?.fullName || user?.userName}
                  {isAdmin && <span className="mr-1 text-xs text-destructive font-bold">(مدير)</span>}
                  {!isAdmin && isStaff && <span className="mr-1 text-xs text-primary font-bold">(موظف)</span>}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>تسجيل الخروج</Button>
              </>
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

        {/* Sub-navigation for authenticated users */}
        {isAuthenticated && subNav && (
          <div className="border-t bg-muted/30">
            <div className="container mx-auto px-4">
              <nav className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                {subNav.map((item) => {
                  const active = item.href === "/staff/dashboard" || item.href === "/admin/dashboard"
                    ? location === item.href
                    : location.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-5 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} مستشفى غريان المركزي — بنك الدم. جميع الحقوق محفوظة.</p>
          <span>للطوارئ: 1415</span>
        </div>
      </footer>
    </div>
  );
}

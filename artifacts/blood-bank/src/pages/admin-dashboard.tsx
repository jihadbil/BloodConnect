import StaffDashboard from "./staff-dashboard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div>
      <div className="container mx-auto px-4 pt-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">إدارة المستخدمين</Link>
          </Button>
          <span className="text-xs text-muted-foreground">لوحة مدير النظام</span>
        </div>
      </div>
      <StaffDashboard />
    </div>
  );
}

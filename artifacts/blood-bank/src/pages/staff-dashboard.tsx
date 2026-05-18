import {
  useGetDashboardSummary,
  useGetMonthlyDonations,
  useGetRequestsByUrgency,
  useGetDonorBloodTypeDistribution,
  useGetInventory,
  useGetExpiringInventory,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { month: "short", day: "numeric" });
}

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const PIE_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2", "#fef2f2", "#b91c1c"];

export default function StaffDashboard() {
  const { data: summaryRes, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: monthlyRes } = useGetMonthlyDonations({});
  const { data: urgencyRes } = useGetRequestsByUrgency();
  const { data: bloodTypeRes } = useGetDonorBloodTypeDistribution();
  const { data: inventoryRes } = useGetInventory();
  const { data: expiringRes } = useGetExpiringInventory({ daysThreshold: 7 });

  const summary = summaryRes?.data;
  const monthlyData = (monthlyRes?.data || []).map(m => ({
    name: MONTH_NAMES[(m.month ?? 1) - 1],
    تبرعات: m.count ?? 0,
  }));
  const urgencyData = (urgencyRes?.data || []).map(u => ({
    name: u.urgencyLevel === "1" || u.urgencyLevel === "Normal" ? "عادي" :
          u.urgencyLevel === "2" || u.urgencyLevel === "Urgent" ? "عاجل" : "طارئ",
    value: u.count ?? 0,
  }));
  const bloodTypeData = (bloodTypeRes?.data || []).map(b => ({
    name: b.bloodType,
    value: b.count ?? 0,
  }));
  const inventory = inventoryRes?.data || [];
  const expiring = expiringRes?.data || [];

  const statCards = [
    { label: "متبرعون نشطون", value: summary?.activeDonorsCount ?? 0, color: "text-primary" },
    { label: "تبرعات هذا الشهر", value: summary?.donationsThisMonth ?? 0, color: "text-blue-600" },
    { label: "طلبات معلقة", value: summary?.pendingRequestsCount ?? 0, color: "text-orange-500" },
    { label: "حالات طارئة", value: summary?.emergencyRequestsCount ?? 0, color: "text-destructive" },
    { label: "تم الوفاء (هذا الشهر)", value: summary?.fulfilledRequestsThisMonth ?? 0, color: "text-green-600" },
    { label: "وحدات قاربت الانتهاء", value: summary?.expiringUnitsCount ?? 0, color: "text-yellow-600" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">لوحة تحكم الموظفين</h1>
        <p className="text-muted-foreground">نظرة شاملة على عمليات بنك الدم</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {summaryLoading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map(s => (
            <Card key={s.label} className="border shadow-sm text-center">
              <CardContent className="pt-6">
                <div className={`text-4xl font-black mb-1 ${s.color}`}>{s.value}</div>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Donations Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">التبرعات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Cairo" }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: "Cairo" }} />
                  <Tooltip formatter={(v) => [`${v} تبرع`, "التبرعات"]} />
                  <Bar dataKey="تبرعات" fill="hsl(348,83%,47%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Blood Type Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">توزيع فصائل الدم بين المتبرعين</CardTitle>
          </CardHeader>
          <CardContent>
            {bloodTypeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bloodTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {bloodTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">حالة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا بيانات</p>
            ) : (
              <div className="space-y-2">
                {inventory.map(inv => (
                  <div key={inv.inventoryID} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                    <span className="font-bold text-primary">{inv.bloodTypeName}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">متاح: <span className="font-semibold text-foreground">{inv.quantityAvailable}</span></span>
                      <span className="text-muted-foreground">محجوز: <span className="font-semibold text-foreground">{inv.quantityReserved}</span></span>
                      {(inv.quantityAvailable ?? 0) < 5 && (
                        <Badge variant="destructive" className="text-xs">منخفض</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Units */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">وحدات قاربت الانتهاء (7 أيام)</CardTitle>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد وحدات قاربت الانتهاء</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expiring.map(item => (
                  <div key={item.inventoryItemID} className="flex items-center justify-between p-2 rounded border bg-yellow-50">
                    <div>
                      <span className="font-bold text-primary">{item.bloodTypeName}</span>
                      <span className="text-xs text-muted-foreground mr-2">— {item.donorName}</span>
                    </div>
                    <div className="text-xs text-orange-700 font-medium">
                      انتهاء: {formatDate(item.expiryDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useGetInventory, useGetLowStockInventory, useGetExpiringInventory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
}

export default function StaffInventory() {
  const { data: inventoryRes, isLoading } = useGetInventory();
  const { data: lowStockRes, isLoading: lowLoading } = useGetLowStockInventory({ threshold: 5 });
  const { data: expiringRes, isLoading: expLoading } = useGetExpiringInventory({ daysThreshold: 14 });

  const inventory = inventoryRes?.data || [];
  const lowStock = lowStockRes?.data || [];
  const expiring = expiringRes?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">مخزون الدم</h1>
        <p className="text-muted-foreground">متابعة مستويات المخزون والوحدات المنتهية الصلاحية</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : inventory.slice(0, 8).map(inv => (
            <Card key={inv.inventoryID} className={`border shadow-sm text-center ${(inv.quantityAvailable ?? 0) < 5 ? "border-destructive/50 bg-destructive/5" : ""}`}>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black text-primary mb-1">{inv.bloodTypeName}</div>
                <div className="text-2xl font-bold text-foreground">{inv.quantityAvailable}</div>
                <div className="text-xs text-muted-foreground">وحدة متاحة</div>
                {(inv.quantityAvailable ?? 0) < 5 && (
                  <Badge variant="destructive" className="mt-2 text-xs">منخفض</Badge>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      <Tabs defaultValue="all" dir="rtl">
        <TabsList className="mb-6">
          <TabsTrigger value="all">جميع الأنواع</TabsTrigger>
          <TabsTrigger value="low">مخزون منخفض {lowStock.length > 0 && `(${lowStock.length})`}</TabsTrigger>
          <TabsTrigger value="expiring">قاربت الانتهاء {expiring.length > 0 && `(${expiring.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">تفاصيل المخزون</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded" />)}
                </div>
              ) : inventory.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">لا بيانات</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                        <th className="p-3 text-right font-semibold">متاح</th>
                        <th className="p-3 text-right font-semibold">محجوز</th>
                        <th className="p-3 text-right font-semibold">عدد الوحدات</th>
                        <th className="p-3 text-right font-semibold">آخر تحديث</th>
                        <th className="p-3 text-right font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(inv => (
                        <tr key={inv.inventoryID} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-bold text-primary text-lg">{inv.bloodTypeName}</td>
                          <td className="p-3 font-semibold">{inv.quantityAvailable}</td>
                          <td className="p-3 text-muted-foreground">{inv.quantityReserved}</td>
                          <td className="p-3 text-muted-foreground">{inv.itemsCount ?? 0}</td>
                          <td className="p-3 text-xs text-muted-foreground">{formatDate(inv.lastUpdated)}</td>
                          <td className="p-3">
                            {(inv.quantityAvailable ?? 0) < 5
                              ? <Badge variant="destructive">منخفض</Badge>
                              : (inv.quantityAvailable ?? 0) < 10
                              ? <Badge variant="outline" className="text-orange-600 border-orange-300">تحذير</Badge>
                              : <Badge variant="secondary">جيد</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">مخزون منخفض (أقل من 5 وحدات)</CardTitle>
            </CardHeader>
            <CardContent>
              {lowLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-12 rounded" />)}
                </div>
              ) : lowStock.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">المخزون جيد لجميع الأنواع</p>
              ) : (
                <div className="space-y-3">
                  {lowStock.map(inv => (
                    <div key={inv.inventoryID} className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                      <span className="font-bold text-primary text-xl">{inv.bloodTypeName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">متاح: <span className="font-bold text-destructive">{inv.quantityAvailable}</span> وحدة</span>
                        <Badge variant="destructive">يحتاج تجديد</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">وحدات قاربت الانتهاء (14 يوم)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {expLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded" />)}
                </div>
              ) : expiring.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">لا توجد وحدات قاربت الانتهاء</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                        <th className="p-3 text-right font-semibold">المتبرع</th>
                        <th className="p-3 text-right font-semibold">الكمية</th>
                        <th className="p-3 text-right font-semibold">تاريخ الانتهاء</th>
                        <th className="p-3 text-right font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiring.map(item => (
                        <tr key={item.inventoryItemID} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-bold text-primary">{item.bloodTypeName}</td>
                          <td className="p-3">{item.donorName}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3 text-xs text-orange-700 font-medium">{formatDate(item.expiryDate)}</td>
                          <td className="p-3">
                            {item.isExpired
                              ? <Badge variant="destructive">منتهية الصلاحية</Badge>
                              : <Badge variant="outline" className="text-orange-600 border-orange-300">قريبة</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useAuth } from "@/hooks/use-auth";
import { useGetDonationsByDonor, useGetDonorResponsesByDonor, useGetDonor, useUpdateDonor, getGetDonorQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" });
}

const bloodTypeLabel = (name: string | undefined) => name || "—";

const urgencyMap: Record<number, { label: string; class: string }> = {
  1: { label: "عادي", class: "bg-green-100 text-green-800" },
  2: { label: "عاجل", class: "bg-orange-100 text-orange-800" },
  3: { label: "طارئ", class: "bg-red-100 text-red-800" },
};

const responseStatusMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  0: { label: "معلق", variant: "secondary" },
  1: { label: "مؤكد", variant: "default" },
  2: { label: "ملغى", variant: "destructive" },
};

const testResultMap: Record<number, string> = {
  0: "قيد الانتظار",
  1: "ناجح",
  2: "فاشل",
};

export default function DonorDashboard() {
  const { donorId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: donorRes, isLoading: donorLoading } = useGetDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: getGetDonorQueryKey(donorId!) },
  });
  const donor = donorRes?.data;

  const { data: donationsRes, isLoading: donationsLoading } = useGetDonationsByDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: ["getDonationsByDonor", donorId] },
  });
  const donations = donationsRes?.data || [];

  const { data: responsesRes, isLoading: responsesLoading } = useGetDonorResponsesByDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: ["getDonorResponsesByDonor", donorId] },
  });
  const responses = responsesRes?.data || [];

  const updateDonorMutation = useUpdateDonor();

  const toggleAvailability = () => {
    if (!donor || !donorId) return;
    updateDonorMutation.mutate(
      { id: donorId, data: { isAvailable: !donor.isAvailable } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDonorQueryKey(donorId!) });
          toast({ title: donor.isAvailable ? "تم تعيينك غير متاح" : "تم تعيينك متاحاً للتبرع" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const approvalStatusMap: Record<number, { label: string; class: string }> = {
    0: { label: "قيد المراجعة", class: "bg-yellow-100 text-yellow-800" },
    1: { label: "موافق عليه", class: "bg-green-100 text-green-800" },
    2: { label: "مرفوض", class: "bg-red-100 text-red-800" },
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">مرحباً، {user?.fullName || user?.userName}</h1>
        <p className="text-muted-foreground">لوحة تحكم المتبرع</p>
      </div>

      {/* Donor Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {donorLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">فصيلة الدم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-primary">{bloodTypeLabel(donor?.bloodTypeName)}</div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">إجمالي التبرعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-foreground">{donor?.totalDonations ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">آخر تبرع: {formatDate(donor?.lastDonationDate)}</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">حالة الحساب</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${approvalStatusMap[donor?.approvalStatus ?? 0]?.class}`}>
                  {approvalStatusMap[donor?.approvalStatus ?? 0]?.label}
                </span>
                <div className="flex items-center gap-2 mt-3">
                  <Switch
                    id="available"
                    checked={!!donor?.isAvailable}
                    onCheckedChange={toggleAvailability}
                    disabled={updateDonorMutation.isPending}
                  />
                  <Label htmlFor="available" className="text-sm">
                    {donor?.isAvailable ? "متاح للتبرع" : "غير متاح حالياً"}
                  </Label>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button asChild>
          <Link href="/donor/requests">تصفح طلبات الدم والاستجابة</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/profile">تعديل الملف الشخصي</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation History */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">سجل التبرعات</CardTitle>
          </CardHeader>
          <CardContent>
            {donationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : donations.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">لا يوجد سجل تبرعات بعد</p>
            ) : (
              <div className="space-y-3">
                {donations.slice(0, 5).map(d => (
                  <div key={d.donationID} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">{formatDate(d.donationDate)}</p>
                      <p className="text-xs text-muted-foreground">{d.bloodTypeName} — {d.quantity} وحدة</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.testResult === 1 ? "bg-green-100 text-green-700" : d.testResult === 2 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {testResultMap[d.testResult ?? 0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responses */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">استجاباتي على الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {responsesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : responses.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">لم تستجب لأي طلبات بعد</p>
            ) : (
              <div className="space-y-3">
                {responses.slice(0, 5).map(r => (
                  <div key={r.responseID} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">طلب #{r.requestID}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.respondedAt)}</p>
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                    <Badge variant={responseStatusMap[r.status ?? 0]?.variant}>
                      {responseStatusMap[r.status ?? 0]?.label}
                    </Badge>
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

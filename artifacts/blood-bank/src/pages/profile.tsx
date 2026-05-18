import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetDonor, useUpdateDonor, useChangePassword, getGetDonorQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" });
}

export default function Profile() {
  const { donorId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: donorRes, isLoading } = useGetDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: getGetDonorQueryKey(donorId!) },
  });
  const donor = donorRes?.data;

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const updateMutation = useUpdateDonor();
  const changePasswordMutation = useChangePassword();

  const handleEdit = () => {
    setPhone(donor?.phone || "");
    setCity(donor?.city || "");
    setEditMode(true);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { id: donorId!, data: { phone, city } },
      {
        onSuccess: (res) => {
          if (res.isSuccess) {
            toast({ title: "تم تحديث البيانات بنجاح" });
            queryClient.invalidateQueries({ queryKey: getGetDonorQueryKey(donorId!) });
            setEditMode(false);
          } else {
            toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
          }
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(
      { data: { currentPassword, newPassword } },
      {
        onSuccess: (res) => {
          if (res.isSuccess) {
            toast({ title: "تم تغيير كلمة المرور بنجاح" });
            setCurrentPassword("");
            setNewPassword("");
          } else {
            toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
          }
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      }
    );
  };

  const genderLabel = (g: number | undefined) => g === 0 ? "ذكر" : g === 1 ? "أنثى" : "—";

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">الملف الشخصي</h1>
        <p className="text-muted-foreground">{user?.fullName || user?.userName}</p>
      </div>

      {/* Donor Info Card */}
      <Card className="mb-6 border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">معلومات المتبرع</CardTitle>
          {!editMode ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>تعديل</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>إلغاء</Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 rounded" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">الاسم الكامل</Label>
                <p className="font-medium">{donor?.fullName || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">الرقم الوطني</Label>
                <p className="font-medium" dir="ltr">{donor?.nationalID || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">الجنس</Label>
                <p className="font-medium">{genderLabel(donor?.gender)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">تاريخ الميلاد</Label>
                <p className="font-medium">{formatDate(donor?.dateOfBirth)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">فصيلة الدم</Label>
                <p className="font-bold text-primary text-lg">{donor?.bloodTypeName || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">إجمالي التبرعات</Label>
                <p className="font-medium">{donor?.totalDonations ?? 0} تبرع</p>
              </div>

              {editMode ? (
                <>
                  <div>
                    <Label htmlFor="phone" className="text-xs text-muted-foreground">رقم الهاتف</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs text-muted-foreground">المدينة</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
                    <p className="font-medium" dir="ltr">{donor?.phone || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">المدينة</Label>
                    <p className="font-medium">{donor?.city || "—"}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div>
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                dir="ltr"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                dir="ltr"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending} data-testid="button-change-password">
              {changePasswordMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

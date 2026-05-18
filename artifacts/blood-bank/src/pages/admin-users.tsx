import { useState } from "react";
import { useGetUsers, useAssignRole, useToggleUserStatus, getGetUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [roleDialog, setRoleDialog] = useState<{ userId: string } | null>(null);
  const [toggleTarget, setToggleTarget] = useState<string>("");
  const [newRole, setNewRole] = useState("Donor");

  const pageSize = 20;
  const { data: usersRes, isLoading } = useGetUsers(
    { PageNumber: page, PageSize: pageSize },
    { query: { queryKey: getGetUsersQueryKey({ PageNumber: page, PageSize: pageSize }) } }
  );
  const users = usersRes?.data?.items || [];
  const totalPages = usersRes?.data?.totalPages || 1;
  const totalCount = usersRes?.data?.totalCount || 0;

  const assignRoleMutation = useAssignRole();
  const toggleStatusMutation = useToggleUserStatus();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });

  const handleAssignRole = () => {
    if (!roleDialog) return;
    assignRoleMutation.mutate(
      { data: { userId: roleDialog.userId, roleName: newRole } },
      {
        onSuccess: (res) => {
          if (res.isSuccess) { toast({ title: "تم تعيين الدور" }); invalidate(); setRoleDialog(null); }
          else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      }
    );
  };

  const handleToggle = (userId: string, isActive: boolean) => {
    setToggleTarget(userId);
    setTimeout(() => {
      toggleStatusMutation.mutate({ id: userId }, {
        onSuccess: (res) => {
          if (res.isSuccess) {
            toast({ title: isActive ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم" });
            invalidate();
          } else {
            toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
          }
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      });
    }, 0);
  };

  const roleLabel = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return "بلا دور";
    const map: Record<string, string> = { Admin: "مدير", Staff: "موظف", Donor: "متبرع" };
    return roles.map(r => map[r] || r).join(", ");
  };

  const roleVariant = (roles: string[] | undefined): "default" | "secondary" | "outline" | "destructive" => {
    if (!roles || roles.length === 0) return "outline";
    if (roles.includes("Admin")) return "destructive";
    if (roles.includes("Staff")) return "default";
    return "secondary";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إجمالي: {totalCount} مستخدم</p>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا يوجد مستخدمون</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-semibold">الاسم</th>
                    <th className="p-3 text-right font-semibold">اسم المستخدم</th>
                    <th className="p-3 text-right font-semibold">البريد</th>
                    <th className="p-3 text-right font-semibold">الدور</th>
                    <th className="p-3 text-right font-semibold">الحالة</th>
                    <th className="p-3 text-right font-semibold">تاريخ الإنشاء</th>
                    <th className="p-3 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/20" data-testid={`row-user-${u.id}`}>
                      <td className="p-3 font-medium">{u.fullName || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground" dir="ltr">{u.userName}</td>
                      <td className="p-3 text-xs text-muted-foreground" dir="ltr">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={roleVariant(u.roles || [])}>
                          {roleLabel(u.roles || [])}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.isActive
                          ? <Badge className="bg-green-600 hover:bg-green-700">نشط</Badge>
                          : <Badge variant="secondary">معطّل</Badge>
                        }
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setNewRole(u.roles?.[0] || "Donor");
                              setRoleDialog({ userId: u.id! });
                            }}
                            data-testid={`button-assign-role-${u.id}`}
                          >
                            تعيين دور
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`text-xs ${u.isActive ? "text-destructive border-destructive/30 hover:bg-destructive/5" : "text-green-700 border-green-300 hover:bg-green-50"}`}
                            onClick={() => handleToggle(u.id!, !!u.isActive)}
                            data-testid={`button-toggle-${u.id}`}
                          >
                            {u.isActive ? "تعطيل" : "تفعيل"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
        </div>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={roleDialog !== null} onOpenChange={() => setRoleDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعيين دور للمستخدم</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>الدور</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Donor">متبرع</SelectItem>
                <SelectItem value="Staff">موظف</SelectItem>
                <SelectItem value="Admin">مدير</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleDialog(null)}>إلغاء</Button>
            <Button onClick={handleAssignRole} disabled={assignRoleMutation.isPending} data-testid="button-confirm-role">
              {assignRoleMutation.isPending ? "جاري التعيين..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

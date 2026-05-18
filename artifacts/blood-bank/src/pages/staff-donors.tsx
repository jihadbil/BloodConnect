import { useState } from "react";
import { useGetDonors, useApproveDonor, useDeleteDonor, getGetDonorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
}

const approvalMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "قيد المراجعة", variant: "secondary" },
  1: { label: "موافق عليه", variant: "default" },
  2: { label: "مرفوض", variant: "destructive" },
};

const genderLabel = (g: number | undefined) => g === 0 ? "ذكر" : "أنثى";

export default function StaffDonors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [approveDialog, setApproveDialog] = useState<{ id: number; name: string; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pageSize = 20;
  const { data: donorsRes, isLoading } = useGetDonors(
    { PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined },
    { query: { queryKey: getGetDonorsQueryKey({ PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined }) } }
  );
  const donors = donorsRes?.data?.items || [];
  const totalPages = donorsRes?.data?.totalPages || 1;
  const totalCount = donorsRes?.data?.totalCount || 0;

  const approveMutation = useApproveDonor();
  const deleteMutation = useDeleteDonor();

  const handleApprovalAction = () => {
    if (!approveDialog) return;
    const newStatus = approveDialog.action === "approve" ? 1 : 2;
    approveMutation.mutate(
      { id: approveDialog.id, data: { newStatus, rejectionReason: approveDialog.action === "reject" ? rejectionReason : undefined } },
      {
        onSuccess: (res) => {
          if (res.isSuccess) {
            toast({ title: approveDialog.action === "approve" ? "تمت الموافقة على المتبرع" : "تم رفض المتبرع" });
            queryClient.invalidateQueries({ queryKey: getGetDonorsQueryKey() });
            setApproveDialog(null);
            setRejectionReason("");
          } else {
            toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
          }
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة المتبرعين</h1>
          <p className="text-muted-foreground">إجمالي: {totalCount} متبرع</p>
        </div>
        <Input
          placeholder="بحث بالاسم..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
          data-testid="input-search-donors"
        />
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا يوجد متبرعون</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-semibold">الاسم</th>
                    <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                    <th className="p-3 text-right font-semibold">الجنس</th>
                    <th className="p-3 text-right font-semibold">الهاتف</th>
                    <th className="p-3 text-right font-semibold">المدينة</th>
                    <th className="p-3 text-right font-semibold">التبرعات</th>
                    <th className="p-3 text-right font-semibold">آخر تبرع</th>
                    <th className="p-3 text-right font-semibold">الحالة</th>
                    <th className="p-3 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(d => (
                    <tr key={d.donorID} className="border-b hover:bg-muted/20 transition-colors" data-testid={`row-donor-${d.donorID}`}>
                      <td className="p-3 font-medium">{d.fullName}</td>
                      <td className="p-3 font-bold text-primary">{d.bloodTypeName}</td>
                      <td className="p-3">{genderLabel(d.gender)}</td>
                      <td className="p-3 text-xs" dir="ltr">{d.phone}</td>
                      <td className="p-3">{d.city}</td>
                      <td className="p-3">{d.totalDonations ?? 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(d.lastDonationDate)}</td>
                      <td className="p-3">
                        <Badge variant={approvalMap[d.approvalStatus ?? 0]?.variant}>
                          {approvalMap[d.approvalStatus ?? 0]?.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {(d.approvalStatus === 0 || d.approvalStatus === 2) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                              onClick={() => setApproveDialog({ id: d.donorID!, name: d.fullName!, action: "approve" })}
                              data-testid={`button-approve-${d.donorID}`}
                            >
                              موافقة
                            </Button>
                          )}
                          {(d.approvalStatus === 0 || d.approvalStatus === 1) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs"
                              onClick={() => setApproveDialog({ id: d.donorID!, name: d.fullName!, action: "reject" })}
                              data-testid={`button-reject-${d.donorID}`}
                            >
                              رفض
                            </Button>
                          )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
        </div>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialog !== null} onOpenChange={() => { setApproveDialog(null); setRejectionReason(""); }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {approveDialog?.action === "approve" ? "الموافقة على المتبرع" : "رفض المتبرع"}: {approveDialog?.name}
            </DialogTitle>
          </DialogHeader>
          {approveDialog?.action === "reject" && (
            <div className="py-2">
              <Label>سبب الرفض</Label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="أدخل سبب الرفض..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setApproveDialog(null); setRejectionReason(""); }}>إلغاء</Button>
            <Button
              variant={approveDialog?.action === "approve" ? "default" : "destructive"}
              onClick={handleApprovalAction}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending ? "جاري..." : approveDialog?.action === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

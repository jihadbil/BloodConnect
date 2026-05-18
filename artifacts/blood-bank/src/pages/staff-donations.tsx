import { useState } from "react";
import {
  useGetDonations, useCreateDonation, useUpdateDonation, useDeleteDonation,
  useGetDonors, getGetDonationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
}

const testResultMap: Record<number, { label: string; class: string }> = {
  0: { label: "قيد الانتظار", class: "bg-yellow-100 text-yellow-800" },
  1: { label: "ناجح", class: "bg-green-100 text-green-800" },
  2: { label: "فاشل", class: "bg-red-100 text-red-800" },
};

const bloodTypes = [
  { id: 1, name: "A+" }, { id: 2, name: "A-" }, { id: 3, name: "B+" }, { id: 4, name: "B-" },
  { id: 5, name: "AB+" }, { id: 6, name: "AB-" }, { id: 7, name: "O+" }, { id: 8, name: "O-" },
];

export default function StaffDonations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ id: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number } | null>(null);

  const [createForm, setCreateForm] = useState({ donorID: "", bloodTypeID: "1", donationDate: "", quantity: "1", notes: "" });
  const [editForm, setEditForm] = useState({ testResult: "0", notes: "" });

  const pageSize = 20;
  const { data: donationsRes, isLoading } = useGetDonations(
    { PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined },
    { query: { queryKey: getGetDonationsQueryKey({ PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined }) } }
  );
  const donations = donationsRes?.data?.items || [];
  const totalPages = donationsRes?.data?.totalPages || 1;
  const totalCount = donationsRes?.data?.totalCount || 0;

  const { data: donorsRes } = useGetDonors({ PageNumber: 1, PageSize: 200 });
  const donors = donorsRes?.data?.items || [];

  const createMutation = useCreateDonation();
  const updateMutation = useUpdateDonation();
  const deleteMutation = useDeleteDonation();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetDonationsQueryKey() });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        donorID: parseInt(createForm.donorID),
        bloodTypeID: parseInt(createForm.bloodTypeID),
        donationDate: new Date(createForm.donationDate).toISOString(),
        quantity: parseInt(createForm.quantity),
        notes: createForm.notes || undefined,
      }
    }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم تسجيل التبرع" }); invalidate(); setCreateDialog(false); }
        else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: editDialog!.id, data: { testResult: parseInt(editForm.testResult), notes: editForm.notes || undefined }
    }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم تحديث التبرع" }); invalidate(); setEditDialog(null); }
        else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: deleteConfirm!.id }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم حذف التبرع" }); invalidate(); setDeleteConfirm(null); }
        else toast({ title: "حدث خطأ", variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">سجلات التبرعات</h1>
          <p className="text-muted-foreground">إجمالي: {totalCount} تبرع</p>
        </div>
        <div className="flex gap-3">
          <Input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
          <Button onClick={() => setCreateDialog(true)} data-testid="button-add-donation">تسجيل تبرع</Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا توجد سجلات تبرعات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-semibold">المتبرع</th>
                    <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                    <th className="p-3 text-right font-semibold">الكمية</th>
                    <th className="p-3 text-right font-semibold">تاريخ التبرع</th>
                    <th className="p-3 text-right font-semibold">نتيجة الفحص</th>
                    <th className="p-3 text-right font-semibold">في المخزون</th>
                    <th className="p-3 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.donationID} className="border-b hover:bg-muted/20" data-testid={`row-donation-${d.donationID}`}>
                      <td className="p-3 font-medium">{d.donorName}</td>
                      <td className="p-3 font-bold text-primary">{d.bloodTypeName}</td>
                      <td className="p-3">{d.quantity} وحدة</td>
                      <td className="p-3 text-xs">{formatDate(d.donationDate)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${testResultMap[d.testResult ?? 0]?.class}`}>
                          {testResultMap[d.testResult ?? 0]?.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{d.isAddedToInventory ? "نعم" : "لا"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="outline" className="text-xs"
                            onClick={() => { setEditForm({ testResult: String(d.testResult ?? 0), notes: d.notes || "" }); setEditDialog({ id: d.donationID! }); }}
                          >
                            تعديل
                          </Button>
                          <Button
                            size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => setDeleteConfirm({ id: d.donationID! })}
                          >
                            حذف
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

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader><DialogTitle>تسجيل تبرع جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <Label>المتبرع</Label>
              <Select value={createForm.donorID} onValueChange={v => setCreateForm(f => ({ ...f, donorID: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المتبرع" /></SelectTrigger>
                <SelectContent>
                  {donors.filter(d => d.approvalStatus === 1).map(d => (
                    <SelectItem key={d.donorID} value={String(d.donorID)}>{d.fullName} — {d.bloodTypeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>فصيلة الدم</Label>
                <Select value={createForm.bloodTypeID} onValueChange={v => setCreateForm(f => ({ ...f, bloodTypeID: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map(bt => <SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الكمية (وحدات)</Label>
                <Input type="number" min="1" value={createForm.quantity} onChange={e => setCreateForm(f => ({ ...f, quantity: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>تاريخ التبرع</Label>
                <Input type="date" value={createForm.donationDate} onChange={e => setCreateForm(f => ({ ...f, donationDate: e.target.value }))} required dir="ltr" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.donorID} data-testid="button-submit-donation">
                {createMutation.isPending ? "جاري التسجيل..." : "تسجيل التبرع"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog !== null} onOpenChange={() => setEditDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تحديث نتيجة الفحص</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>نتيجة الفحص</Label>
              <Select value={editForm.testResult} onValueChange={v => setEditForm(f => ({ ...f, testResult: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">قيد الانتظار</SelectItem>
                  <SelectItem value="1">ناجح</SelectItem>
                  <SelectItem value="2">فاشل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog(null)}>إلغاء</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-confirm-update-donation">
              {updateMutation.isPending ? "جاري التحديث..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">هل تريد حذف هذا السجل؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-donation">
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

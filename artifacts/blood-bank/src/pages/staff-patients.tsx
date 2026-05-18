import { useState } from "react";
import { useGetPatients, useCreatePatient, useUpdatePatient, useDeletePatient, getGetPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
}

const bloodTypes = [
  { id: 1, name: "A+" }, { id: 2, name: "A-" }, { id: 3, name: "B+" }, { id: 4, name: "B-" },
  { id: 5, name: "AB+" }, { id: 6, name: "AB-" }, { id: 7, name: "O+" }, { id: 8, name: "O-" },
];

type PatientForm = {
  fullName: string;
  nationalID: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  city: string;
  bloodTypeID: string;
};

const emptyForm: PatientForm = { fullName: "", nationalID: "", gender: "0", dateOfBirth: "", phone: "", city: "", bloodTypeID: "1" };

export default function StaffPatients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; patientId?: number } | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const pageSize = 20;
  const { data: patientsRes, isLoading } = useGetPatients(
    { PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined },
    { query: { queryKey: getGetPatientsQueryKey({ PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined }) } }
  );
  const patients = patientsRes?.data?.items || [];
  const totalPages = patientsRes?.data?.totalPages || 1;
  const totalCount = patientsRes?.data?.totalCount || 0;

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (p: typeof patients[0]) => {
    setForm({
      fullName: p.fullName || "",
      nationalID: p.nationalID || "",
      gender: String(p.gender ?? 0),
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      phone: p.phone || "",
      city: p.city || "",
      bloodTypeID: String(p.bloodTypeID ?? 1),
    });
    setDialog({ mode: "edit", patientId: p.patientID });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      fullName: form.fullName,
      nationalID: form.nationalID,
      gender: parseInt(form.gender),
      dateOfBirth: new Date(form.dateOfBirth).toISOString(),
      phone: form.phone,
      city: form.city,
      bloodTypeID: parseInt(form.bloodTypeID),
    };

    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetPatientsQueryKey() });

    if (dialog?.mode === "create") {
      createMutation.mutate({ data }, {
        onSuccess: (res) => {
          if (res.isSuccess) { toast({ title: "تم إضافة المريض" }); invalidate(); setDialog(null); }
          else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      });
    } else {
      updateMutation.mutate({ id: dialog!.patientId!, data: { fullName: form.fullName, phone: form.phone, city: form.city } }, {
        onSuccess: (res) => {
          if (res.isSuccess) { toast({ title: "تم تحديث بيانات المريض" }); invalidate(); setDialog(null); }
          else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate({ id: deleteConfirm!.id }, {
      onSuccess: (res) => {
        if (res.isSuccess) {
          toast({ title: "تم حذف المريض" });
          queryClient.invalidateQueries({ queryKey: getGetPatientsQueryKey() });
          setDeleteConfirm(null);
        } else toast({ title: "حدث خطأ", variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  const genderLabel = (g: number | undefined) => g === 0 ? "ذكر" : "أنثى";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">إدارة المرضى</h1>
          <p className="text-muted-foreground">إجمالي: {totalCount} مريض</p>
        </div>
        <div className="flex gap-3">
          <Input placeholder="بحث بالاسم..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
          <Button onClick={openCreate} data-testid="button-add-patient">إضافة مريض</Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا يوجد مرضى</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-semibold">الاسم</th>
                    <th className="p-3 text-right font-semibold">الرقم الوطني</th>
                    <th className="p-3 text-right font-semibold">الجنس</th>
                    <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                    <th className="p-3 text-right font-semibold">الهاتف</th>
                    <th className="p-3 text-right font-semibold">المدينة</th>
                    <th className="p-3 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.patientID} className="border-b hover:bg-muted/20" data-testid={`row-patient-${p.patientID}`}>
                      <td className="p-3 font-medium">{p.fullName}</td>
                      <td className="p-3 text-xs" dir="ltr">{p.nationalID}</td>
                      <td className="p-3">{genderLabel(p.gender)}</td>
                      <td className="p-3 font-bold text-primary">{p.bloodTypeName}</td>
                      <td className="p-3 text-xs" dir="ltr">{p.phone}</td>
                      <td className="p-3">{p.city}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => openEdit(p)}>تعديل</Button>
                          <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeleteConfirm({ id: p.patientID!, name: p.fullName! })}>حذف</Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialog !== null} onOpenChange={() => setDialog(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "إضافة مريض جديد" : "تعديل بيانات المريض"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>الاسم الكامل</Label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required className="mt-1" />
              </div>
              {dialog?.mode === "create" && (
                <>
                  <div>
                    <Label>الرقم الوطني</Label>
                    <Input value={form.nationalID} onChange={e => setForm(f => ({ ...f, nationalID: e.target.value }))} required dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label>الجنس</Label>
                    <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">ذكر</SelectItem>
                        <SelectItem value="1">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>تاريخ الميلاد</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} required dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label>فصيلة الدم</Label>
                    <Select value={form.bloodTypeID} onValueChange={v => setForm(f => ({ ...f, bloodTypeID: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map(bt => <SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" className="mt-1" />
              </div>
              <div>
                <Label>المدينة</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-patient">
                {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : dialog?.mode === "create" ? "إضافة" : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">هل تريد حذف المريض "{deleteConfirm?.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

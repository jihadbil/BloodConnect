import { useState } from "react";
import {
  useGetBloodRequests, useCreateBloodRequest, useUpdateBloodRequestStatus,
  useCancelBloodRequest, useGetPatients, getGetBloodRequestsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const urgencyMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  1: { label: "عادي", variant: "secondary" },
  2: { label: "عاجل", variant: "outline" },
  3: { label: "طارئ", variant: "destructive" },
};

const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "قيد الانتظار", variant: "secondary" },
  1: { label: "قيد التنفيذ", variant: "default" },
  2: { label: "مكتمل", variant: "outline" },
  3: { label: "ملغى", variant: "destructive" },
};

const bloodTypes = [
  { id: 1, name: "A+" }, { id: 2, name: "A-" }, { id: 3, name: "B+" }, { id: 4, name: "B-" },
  { id: 5, name: "AB+" }, { id: 6, name: "AB-" }, { id: 7, name: "O+" }, { id: 8, name: "O-" },
];

export default function StaffBloodRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createDialog, setCreateDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ id: number } | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{ id: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [newStatus, setNewStatus] = useState("1");
  const [statusNotes, setStatusNotes] = useState("");

  const [createForm, setCreateForm] = useState({
    patientID: "",
    bloodTypeID: "1",
    quantityNeeded: "1",
    urgencyLevel: "1",
    requiredDate: "",
    notes: "",
  });

  const pageSize = 20;
  const { data: requestsRes, isLoading } = useGetBloodRequests(
    { PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined },
    { query: { queryKey: getGetBloodRequestsQueryKey({ PageNumber: page, PageSize: pageSize, SearchTerm: search || undefined }) } }
  );
  const requests = requestsRes?.data?.items || [];
  const totalPages = requestsRes?.data?.totalPages || 1;
  const totalCount = requestsRes?.data?.totalCount || 0;

  const { data: patientsRes } = useGetPatients({ PageNumber: 1, PageSize: 100 });
  const patients = patientsRes?.data?.items || [];

  const createMutation = useCreateBloodRequest();
  const updateStatusMutation = useUpdateBloodRequestStatus();
  const cancelMutation = useCancelBloodRequest();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetBloodRequestsQueryKey() });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        patientID: parseInt(createForm.patientID),
        bloodTypeID: parseInt(createForm.bloodTypeID),
        quantityNeeded: parseInt(createForm.quantityNeeded),
        urgencyLevel: parseInt(createForm.urgencyLevel),
        requiredDate: new Date(createForm.requiredDate).toISOString(),
        notes: createForm.notes || undefined,
      }
    }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم إنشاء الطلب" }); invalidate(); setCreateDialog(false); }
        else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  const handleStatusUpdate = () => {
    updateStatusMutation.mutate({
      id: statusDialog!.id, data: { status: parseInt(newStatus), notes: statusNotes || undefined }
    }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم تحديث الحالة" }); invalidate(); setStatusDialog(null); setStatusNotes(""); }
        else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  const handleCancel = () => {
    cancelMutation.mutate({ id: cancelDialog!.id, data: { reason: cancelReason } }, {
      onSuccess: (res) => {
        if (res.isSuccess) { toast({ title: "تم إلغاء الطلب" }); invalidate(); setCancelDialog(null); setCancelReason(""); }
        else toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
      },
      onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">طلبات الدم</h1>
          <p className="text-muted-foreground">إجمالي: {totalCount} طلب</p>
        </div>
        <div className="flex gap-3">
          <Input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
          <Button onClick={() => setCreateDialog(true)} data-testid="button-create-request">طلب جديد</Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا توجد طلبات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-semibold">#</th>
                    <th className="p-3 text-right font-semibold">المريض</th>
                    <th className="p-3 text-right font-semibold">فصيلة الدم</th>
                    <th className="p-3 text-right font-semibold">الكمية</th>
                    <th className="p-3 text-right font-semibold">المتبقي</th>
                    <th className="p-3 text-right font-semibold">الأولوية</th>
                    <th className="p-3 text-right font-semibold">مطلوب قبل</th>
                    <th className="p-3 text-right font-semibold">الحالة</th>
                    <th className="p-3 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.requestID} className="border-b hover:bg-muted/20" data-testid={`row-request-${r.requestID}`}>
                      <td className="p-3 text-muted-foreground">{r.requestID}</td>
                      <td className="p-3 font-medium">{r.patientName}</td>
                      <td className="p-3 font-bold text-primary">{r.bloodTypeName}</td>
                      <td className="p-3">{r.quantityNeeded}</td>
                      <td className="p-3 text-destructive font-medium">{r.quantityRemaining}</td>
                      <td className="p-3">
                        <Badge variant={urgencyMap[r.urgencyLevel ?? 1]?.variant}>
                          {urgencyMap[r.urgencyLevel ?? 1]?.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">{formatDate(r.requiredDate)}</td>
                      <td className="p-3">
                        <Badge variant={statusMap[r.status ?? 0]?.variant}>
                          {statusMap[r.status ?? 0]?.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {(r.status === 0 || r.status === 1) && (
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setStatusDialog({ id: r.requestID! }); setNewStatus("1"); }}>
                              تحديث
                            </Button>
                          )}
                          {(r.status === 0 || r.status === 1) && (
                            <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setCancelDialog({ id: r.requestID! })}>
                              إلغاء
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
        </div>
      )}

      {/* Create Request Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader><DialogTitle>طلب دم جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <Label>المريض</Label>
              <Select value={createForm.patientID} onValueChange={v => setCreateForm(f => ({ ...f, patientID: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.patientID} value={String(p.patientID)}>{p.fullName}</SelectItem>)}
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
                <Input type="number" min="1" value={createForm.quantityNeeded} onChange={e => setCreateForm(f => ({ ...f, quantityNeeded: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>الأولوية</Label>
                <Select value={createForm.urgencyLevel} onValueChange={v => setCreateForm(f => ({ ...f, urgencyLevel: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">عادي</SelectItem>
                    <SelectItem value="2">عاجل</SelectItem>
                    <SelectItem value="3">طارئ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>مطلوب قبل</Label>
                <Input type="date" value={createForm.requiredDate} onChange={e => setCreateForm(f => ({ ...f, requiredDate: e.target.value }))} required dir="ltr" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.patientID} data-testid="button-submit-request">
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog !== null} onOpenChange={() => { setStatusDialog(null); setStatusNotes(""); }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تحديث حالة الطلب</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">قيد التنفيذ</SelectItem>
                  <SelectItem value="2">مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={statusNotes} onChange={e => setStatusNotes(e.target.value)} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setStatusDialog(null); setStatusNotes(""); }}>إلغاء</Button>
            <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending} data-testid="button-confirm-status">
              {updateStatusMutation.isPending ? "جاري التحديث..." : "تحديث"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog !== null} onOpenChange={() => { setCancelDialog(null); setCancelReason(""); }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إلغاء الطلب</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>سبب الإلغاء</Label>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} required rows={3} className="mt-1" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCancelDialog(null); setCancelReason(""); }}>رجوع</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending || !cancelReason} data-testid="button-confirm-cancel">
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetBloodRequests, useCreateDonorResponse, getGetBloodRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" });
}

const urgencyMap: Record<number, { label: string; class: string }> = {
  1: { label: "عادي", class: "bg-green-100 text-green-800" },
  2: { label: "عاجل", class: "bg-orange-100 text-orange-800" },
  3: { label: "طارئ", class: "bg-red-100 text-red-800 animate-pulse" },
};

const statusMap: Record<number, { label: string; show: boolean }> = {
  0: { label: "قيد الانتظار", show: true },
  1: { label: "قيد التنفيذ", show: true },
  2: { label: "مكتمل", show: false },
  3: { label: "ملغى", show: false },
};

export default function DonorRequests() {
  const { donorId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: requestsRes, isLoading } = useGetBloodRequests(
    { PageNumber: 1, PageSize: 50 },
    { query: { queryKey: getGetBloodRequestsQueryKey({ PageNumber: 1, PageSize: 50 }) } }
  );
  const allRequests = requestsRes?.data?.items || [];
  const requests = allRequests.filter(r => statusMap[r.status ?? 0]?.show);

  const respondMutation = useCreateDonorResponse();

  const handleRespond = () => {
    if (!donorId || !selectedRequest) return;
    respondMutation.mutate(
      { data: { donorID: donorId, requestID: selectedRequest, notes: notes || undefined } },
      {
        onSuccess: (res) => {
          if (res.isSuccess) {
            toast({ title: "تم إرسال استجابتك بنجاح" });
            setSelectedRequest(null);
            setNotes("");
            queryClient.invalidateQueries({ queryKey: getGetBloodRequestsQueryKey() });
          } else {
            toast({ title: "حدث خطأ", description: res.message || undefined, variant: "destructive" });
          }
        },
        onError: () => toast({ title: "حدث خطأ في الاتصال", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">طلبات الدم</h1>
        <p className="text-muted-foreground">تصفح الطلبات النشطة واستجب لما يناسب فصيلة دمك</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد طلبات نشطة حالياً</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <Card key={req.requestID} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">طلب #{req.requestID}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${urgencyMap[req.urgencyLevel ?? 1]?.class}`}>
                    {urgencyMap[req.urgencyLevel ?? 1]?.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">فصيلة الدم:</span>
                    <span className="font-bold text-primary text-lg">{req.bloodTypeName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الكمية المطلوبة:</span>
                    <span className="font-medium">{req.quantityNeeded} وحدة</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المتبقي:</span>
                    <span className="font-medium text-destructive">{req.quantityRemaining} وحدة</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مطلوب قبل:</span>
                    <span className="font-medium">{formatDate(req.requiredDate)}</span>
                  </div>
                  {req.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{req.notes}</p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => setSelectedRequest(req.requestID!)}
                  data-testid={`button-respond-${req.requestID}`}
                >
                  أرغب في التبرع
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedRequest !== null} onOpenChange={() => { setSelectedRequest(null); setNotes(""); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>الاستجابة للطلب #{selectedRequest}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">سيتم إشعار فريق بنك الدم باستجابتك وسيتواصلون معك قريباً.</p>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات (اختياري)</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setNotes(""); }}>إلغاء</Button>
            <Button onClick={handleRespond} disabled={respondMutation.isPending} data-testid="button-confirm-response">
              {respondMutation.isPending ? "جاري الإرسال..." : "تأكيد الاستجابة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

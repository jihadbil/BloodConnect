import { useGetPendingBloodRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function PublicBloodRequests() {
  const { data: requestsRes, isLoading } = useGetPendingBloodRequests();
  const requests = requestsRes?.data || [];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">لوحة طلبات الدم</h1>
        <p className="text-muted-foreground">المرضى الذين هم بحاجة ماسة لقطرات من دمك لإنقاذ حياتهم.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">لا توجد طلبات دم معلقة حالياً.</div>
            <p>شكراً لاهتمامك. بفضل المتبرعين مثلك، يتم تلبية احتياجات المرضى باستمرار.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(request => (
            <Card key={request.requestID} className={`overflow-hidden border-t-4 ${
              request.urgencyLevel === 3 ? 'border-t-destructive' : 
              request.urgencyLevel === 2 ? 'border-t-orange-500' : 'border-t-primary'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{request.patientName}</CardTitle>
                    <CardDescription>تاريخ الطلب: {new Date(request.requestDate || "").toLocaleDateString('ar-LY')}</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl border border-red-200 shadow-sm">
                    {request.bloodTypeName}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مستوى الأهمية:</span>
                  <Badge variant={
                    request.urgencyLevel === 3 ? 'destructive' : 
                    request.urgencyLevel === 2 ? 'outline' : 'secondary'
                  } className={request.urgencyLevel === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}>
                    {request.urgencyLevel === 3 ? 'طارئ' : request.urgencyLevel === 2 ? 'عاجل' : 'عادي'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الكمية المطلوبة:</span>
                  <span className="font-medium">{request.quantityNeeded} أكياس</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المتبقي:</span>
                  <span className="font-bold text-destructive">{request.quantityRemaining} أكياس</span>
                </div>
                {request.notes && (
                  <div className="bg-muted p-3 rounded-md text-sm mt-2 border">
                    {request.notes}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 pt-4">
                <Button className="w-full" asChild>
                  <Link href="/login">تسجيل الدخول للتبرع</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

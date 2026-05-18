import { useState } from "react";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { userName, password } },
      {
        onSuccess: (res) => {
          if (res.isSuccess && res.data?.token && res.data?.user) {
            login(res.data.token, res.data.user);
            const roles = res.data.user.roles || [];
            let dest = "/";
            if (roles.includes("Admin")) dest = "/admin/dashboard";
            else if (roles.includes("Staff")) dest = "/staff/dashboard";
            else if (roles.includes("Donor")) dest = "/donor/dashboard";
            window.location.href = dest;
          } else {
            toast({
              title: "خطأ في تسجيل الدخول",
              description: res.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
              variant: "destructive"
            });
          }
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "حدث خطأ أثناء الاتصال بالخادم";
          toast({
            title: "خطأ في الاتصال",
            description: message,
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <Card className="border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto flex items-center justify-center text-primary-foreground font-bold text-2xl mb-2">
            ب
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بيانات حسابك للوصول إلى منصة بنك الدم</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">اسم المستخدم</Label>
              <Input 
                id="userName" 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                required 
                placeholder="أدخل اسم المستخدم"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="أدخل كلمة المرور"
                dir="ltr"
                className="text-right"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <div className="text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              إنشاء حساب جديد
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

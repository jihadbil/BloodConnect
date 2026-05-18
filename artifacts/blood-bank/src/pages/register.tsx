import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useCreateDonor } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Account details
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Donor details
  const [fullName, setFullName] = useState("");
  const [nationalID, setNationalID] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("0");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodTypeID, setBloodTypeID] = useState("");
  const [city, setCity] = useState("غريان");

  const registerMutation = useRegister();
  const createDonorMutation = useCreateDonor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Register User
    registerMutation.mutate(
      { 
        data: { 
          userName, 
          email, 
          password, 
          fullName, 
          phoneNumber,
          role: "Donor"
        } 
      },
      {
        onSuccess: (userRes) => {
          if (userRes && userRes.id) {
            // Step 2: Create Donor Profile
            createDonorMutation.mutate(
              {
                data: {
                  fullName,
                  nationalID,
                  gender: parseInt(gender),
                  dateOfBirth,
                  phone: phoneNumber,
                  bloodTypeID: parseInt(bloodTypeID),
                  city,
                  userId: userRes.id
                }
              },
              {
                onSuccess: (donorRes) => {
                  toast({
                    title: "تم إنشاء الحساب بنجاح",
                    description: "يمكنك الآن تسجيل الدخول بحسابك الجديد",
                  });
                  setLocation("/login");
                },
                onError: () => {
                  toast({
                    title: "خطأ",
                    description: "تم إنشاء حساب المستخدم لكن حدث خطأ في إنشاء ملف المتبرع",
                    variant: "destructive"
                  });
                }
              }
            );
          } else {
            toast({
              title: "خطأ في إنشاء الحساب",
              description: "حدث خطأ غير معروف",
              variant: "destructive"
            });
          }
        },
        onError: () => {
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء إنشاء الحساب. قد يكون اسم المستخدم موجوداً بالفعل.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">تسجيل متبرع جديد</CardTitle>
          <CardDescription>الرجاء إدخال بياناتك بدقة لتسهيل عملية التواصل والتبرع</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">بيانات الحساب</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">اسم المستخدم</Label>
                  <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className="text-right" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">البيانات الشخصية والطبية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fullName">الاسم الرباعي</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalID">الرقم الوطني</Label>
                  <Input id="nationalID" value={nationalID} onChange={(e) => setNationalID(e.target.value)} required dir="ltr" className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                  <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required dir="ltr" className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
                  <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">ذكر</SelectItem>
                      <SelectItem value="1">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodTypeID">فصيلة الدم</Label>
                  <Select value={bloodTypeID} onValueChange={setBloodTypeID} required>
                    <SelectTrigger><SelectValue placeholder="اختر الفصيلة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">A+</SelectItem>
                      <SelectItem value="2">A-</SelectItem>
                      <SelectItem value="3">B+</SelectItem>
                      <SelectItem value="4">B-</SelectItem>
                      <SelectItem value="5">AB+</SelectItem>
                      <SelectItem value="6">AB-</SelectItem>
                      <SelectItem value="7">O+</SelectItem>
                      <SelectItem value="8">O-</SelectItem>
                      <SelectItem value="9">غير معروف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              disabled={registerMutation.isPending || createDonorMutation.isPending}
            >
              {registerMutation.isPending || createDonorMutation.isPending ? "جاري الإنشاء..." : "إنشاء حساب"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <div className="text-sm text-muted-foreground">
            لديك حساب مسبقاً؟{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              تسجيل الدخول
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

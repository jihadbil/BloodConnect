import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import heroBg from "@assets/hero-bg-DwptvPGR_1779110946091.jpg";

export default function Home() {
  const { data: summaryRes, isLoading } = useGetDashboardSummary();
  const summary = summaryRes?.data;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 z-10 bg-black/60" />
        
        <div className="container relative z-20 mx-auto px-4 flex flex-col items-center text-center text-white">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">قطرة دم تنقذ حياة</h1>
          <p className="text-lg md:text-2xl max-w-2xl mb-10 text-gray-200">
            بنك الدم بمستشفى غريان المركزي يرحب بكم. تبرعك بالدم يعطي أملاً جديداً للمرضى في مدينتنا. كن سبباً في الحياة.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full" asChild>
              <Link href="/register">سجل كمتبرع الآن</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full bg-white/10 text-white border-white hover:bg-white/20 hover:text-white" asChild>
              <Link href="/blood-requests">عرض طلبات الدم العاجلة</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">إحصائيات بنك الدم</h2>
            <p className="text-muted-foreground">نظرة عامة على حالة المخزون والطلبات</p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-xl p-6 border shadow-sm h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-primary mb-2">{summary?.activeDonorsCount || 0}</span>
                <span className="text-muted-foreground font-medium">متبرع نشط</span>
              </div>
              <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-blue-600 mb-2">{summary?.donationsThisMonth || 0}</span>
                <span className="text-muted-foreground font-medium">تبرع هذا الشهر</span>
              </div>
              <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-destructive mb-2">{summary?.emergencyRequestsCount || 0}</span>
                <span className="text-muted-foreground font-medium">حالة طارئة حالياً</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">هل أنت مستعد للتبرع؟</h2>
          <p className="text-xl mb-8 text-primary-foreground/80">
            عملية التبرع آمنة وسريعة وتستغرق حوالي 15 دقيقة فقط. كل تبرع يمكن أن ينقذ حتى 3 أرواح.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-10 py-6 rounded-full font-bold" asChild>
            <Link href="/login">تسجيل الدخول للتبرع</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

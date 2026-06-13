export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Branding */}
      <div className="absolute top-8 left-8 text-2xl font-heading font-bold text-primary">
        ShadowMap
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {children}
      </div>
    </div>
  );
}

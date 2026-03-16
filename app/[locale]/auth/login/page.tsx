import SignIn from "@/components/auth/SignIn";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="font-heading font-bold text-2xl text-dark tracking-tight">
            solen<span className="text-teal">.</span>ch
          </a>
          <p className="text-dark/50 text-sm mt-2">Willkommen zurück</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-6">
          <SignIn />
        </div>
      </div>
    </div>
  );
}

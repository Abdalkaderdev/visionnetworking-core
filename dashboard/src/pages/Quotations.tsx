import { FileText } from "lucide-react";

export default function Quotations() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]">Quotations</h1>
        <p className="text-sm text-[#64748B]">Generate and manage client quotations</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <FileText size={28} className="text-[#1D4ED8]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-2">Coming Soon</h2>
          <p className="text-sm text-[#64748B] max-w-sm">
            The quotation engine is currently under development. You will be able to generate, preview, and send quotations to clients from here.
          </p>
        </div>
      </div>
    </div>
  );
}

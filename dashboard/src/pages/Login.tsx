import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-white font-bold mx-auto mb-4">
            VN
          </div>
          <h1 className="text-xl font-semibold text-white">VisionNetworking</h1>
          <p className="text-sm text-[#64748B] mt-1">Internal System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none"
              placeholder="admin@visionnetworking.iq"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D4ED8] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

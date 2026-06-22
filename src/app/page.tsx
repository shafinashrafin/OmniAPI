"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Shield,
  GitBranch,
  BarChart3,
  Code2,
  ArrowRight,
  ChevronRight,
  Layers,
  Globe,
  Terminal,
  RefreshCw,
  Key,
  Menu,
  X,
  CheckCircle,
} from "lucide-react";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "@/lib/firebase";
import { createUserProfile } from "@/lib/firebase-db";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, form.email, form.password);
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        
        // Update display name
        await updateProfile(userCredential.user, {
          displayName: form.name,
        });
        
        // Create user profile in database (fire and forget — don't block signup)
        createUserProfile(userCredential.user.uid, {
          email: form.email,
          name: form.name,
        }).catch(() => {});

        // Sign out after registration so user can login
        await auth.signOut();
        
        // Show success and switch to login
        setSignupSuccess(true);
        setForm({ email: form.email, name: "", password: "" });
        setIsLogin(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      // Make Firebase errors more user-friendly
      if (message.includes("auth/email-already-in-use")) {
        setError("Email already registered. Please sign in.");
        setIsLogin(true);
      } else if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
        setError("Invalid email or password.");
      } else if (message.includes("auth/user-not-found")) {
        setError("No account found with this email.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters.");
      } else if (message.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { name: "OpenAI", icon: "◯", color: "#10a37f" },
    { name: "Gemini", icon: "◆", color: "#4285f4" },
    { name: "Claude", icon: "◈", color: "#d4a574" },
    { name: "DeepSeek", icon: "◇", color: "#0066ff" },
    { name: "Grok", icon: "✦", color: "#1da1f2" },
    { name: "Mistral", icon: "▲", color: "#ff7000" },
    { name: "OpenRouter", icon: "◎", color: "#8b5cf6" },
  ];

  const features = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Universal Gateway",
      desc: "One endpoint for every AI model. OpenAI-compatible API that works with all your tools.",
    },
    {
      icon: <Key className="w-5 h-5" />,
      title: "Bring Your Own Keys",
      desc: "Connect your API keys from any provider. No markup, no middleman, full control.",
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: "Automatic Failover",
      desc: "When a provider goes down, traffic automatically routes to the next available one.",
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Model Discovery",
      desc: "Automatically discover and catalog all models from your connected providers.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Key Vault",
      desc: "API keys are encrypted and never exposed. Rotate and manage keys safely.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Usage Analytics",
      desc: "Track requests, tokens, latency, and costs across all providers in real-time.",
    },
  ];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-text-muted animate-pulse" />
          <span className="text-text-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-text-muted animate-pulse" />
          <span className="text-text-muted text-sm">Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">OmniAPI</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-text-muted hover:text-text transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text transition-colors">How it works</a>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(true); setError(""); setSignupSuccess(false); }}
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); setError(""); setSignupSuccess(false); }}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 -mr-2 text-text-muted hover:text-text transition-colors"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div className="md:hidden border-t border-border bg-surface-2 px-4 py-4 space-y-3 animate-fadeIn">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-text-muted hover:text-text py-1">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-text-muted hover:text-text py-1">How it works</a>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(true); setMobileMenu(false); setError(""); setSignupSuccess(false); }}
              className="block text-sm text-text-muted hover:text-text py-1 w-full text-left"
            >
              Sign in
            </button>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); setMobileMenu(false); setError(""); setSignupSuccess(false); }}
              className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-3 border border-border text-text-muted text-xs sm:text-sm mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
            Open Source AI Gateway
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-4 sm:mb-6">
            One API.{" "}
            <span className="text-text-muted">
              Every Model.
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-text-muted max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Connect your AI providers, get one unified endpoint. 
            OpenAI-compatible API that routes to any model from any provider 
            with automatic failover and load balancing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16">
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); setError(""); setSignupSuccess(false); }}
              className="w-full sm:w-auto px-7 py-3 sm:py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 glow text-sm sm:text-base"
            >
              Start for Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-7 py-3 sm:py-3.5 border border-border hover:border-border-hover text-text font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              See How It Works <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>

          {/* Code example */}
          <div className="max-w-2xl mx-auto bg-primary rounded-2xl border border-primary overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
              </div>
              <span className="text-[10px] sm:text-xs text-white/50 ml-2 font-mono">curl</span>
            </div>
            <pre className="p-4 sm:p-6 text-left text-xs sm:text-sm overflow-x-auto">
              <code className="text-white/60">
                <span className="text-white/90">curl</span>{" "}
                <span className="text-white/70">https://your-omniapi.dev/v1/chat/completions</span>{" "}
                \{"\n"}
                {"  "}<span className="text-white/50">-H</span>{" "}
                <span className="text-white/80">{'"Authorization: Bearer omni_xxxxxxxxx"'}</span>{" "}
                \{"\n"}
                {"  "}<span className="text-white/50">-H</span>{" "}
                <span className="text-white/80">{'"Content-Type: application/json"'}</span>{" "}
                \{"\n"}
                {"  "}<span className="text-white/50">-d</span>{" "}
                <span className="text-white/80">{"'"}</span>
                {"\n"}
                {"  "}{"{"}{"\n"}
                {"    "}<span className="text-white/90">{'"model"'}</span>: <span className="text-white/70">{'"gemini-2.5-flash"'}</span>,{"\n"}
                {"    "}<span className="text-white/90">{'"messages"'}</span>: [{"{"}<span className="text-white/90">{'"role"'}</span>: <span className="text-white/70">{'"user"'}</span>, <span className="text-white/90">{'"content"'}</span>: <span className="text-white/70">{'"Hello!"'}</span>{"}"}]{"\n"}
                {"  "}{"}"}<span className="text-white/80">{"'"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Providers */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 border-t border-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-text-muted mb-6 sm:mb-8 uppercase tracking-widest font-medium">
            Supported Providers
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {providers.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-all cursor-default"
              >
                <span className="text-lg sm:text-2xl" style={{ color: p.color }}>
                  {p.icon}
                </span>
                <span className="font-medium text-sm sm:text-base">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-text-muted text-sm sm:text-base lg:text-lg max-w-xl mx-auto">
              A complete AI infrastructure layer that simplifies how you interact with multiple AI providers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-2xl bg-surface-2 border border-border hover:border-border-hover transition-all group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-surface-3 flex items-center justify-center text-text mb-3 sm:mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-text-muted text-sm sm:text-base lg:text-lg">Three steps to unify your AI infrastructure</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {[
              {
                step: "01",
                icon: <Key className="w-5 h-5" />,
                title: "Connect Your Providers",
                desc: "Add your existing API keys from OpenAI, Google, Anthropic, and more. We securely store and validate each key.",
              },
              {
                step: "02",
                icon: <Code2 className="w-5 h-5" />,
                title: "Get Your Unified Key",
                desc: "Generate an OmniAPI key. Use it with any OpenAI-compatible client — no code changes needed.",
              },
              {
                step: "03",
                icon: <GitBranch className="w-5 h-5" />,
                title: "Route to Any Model",
                desc: "Send requests to any model from any provider. OmniAPI handles routing, failover, and load balancing automatically.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="flex gap-4 sm:gap-6 items-start p-4 sm:p-6 rounded-2xl bg-surface-2 border border-border"
              >
                <div className="flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                  {s.step}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className="text-text-muted">{s.icon}</span>
                    <h3 className="text-base sm:text-xl font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
            OpenAI Compatible
          </h2>
          <p className="text-text-muted text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
            Works out-of-the-box with every tool that supports the OpenAI API format.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              "OpenAI SDK",
              "LangChain",
              "CrewAI",
              "Vercel AI SDK",
              "Open WebUI",
              "LibreChat",
              "Chatbox",
              "Continue",
              "Aider",
              "Cursor",
            ].map((tool) => (
              <span
                key={tool}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-surface-2 border border-border text-xs sm:text-sm font-medium text-text-muted"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-surface-2 border border-border">
            <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted mx-auto mb-5 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 tracking-tight">
              Ready to Simplify Your AI Stack?
            </h2>
            <p className="text-text-muted mb-6 sm:mb-8 text-sm sm:text-lg">
              Connect your first provider in under 60 seconds.
            </p>
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); setError(""); setSignupSuccess(false); }}
              className="w-full sm:w-auto px-7 py-3 sm:py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs sm:text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">OmniAPI</span>
          </div>
          <p>One API. Every Model.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}
        >
          <div className="w-full sm:max-w-md bg-surface-2 border border-border rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-5 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">OmniAPI</span>
            </div>

            {/* Success message after signup */}
            {signupSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-success text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Account created successfully! Please sign in.</span>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-text-muted text-sm mb-5 sm:mb-6">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Start routing AI requests in seconds"}
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-error text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAuth} className="space-y-3.5 sm:space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-text-muted block mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-text-muted block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSignupSuccess(false);
                }}
                className="text-text font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

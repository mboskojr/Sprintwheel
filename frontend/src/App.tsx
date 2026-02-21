import "./App.css";
import Banner from "./Banner";
import logo from "./assets/logo.png";
import { useState } from "react";
import { login, me, register } from "./api/auth";

function App() {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setUser(null);

    try {
      //  if registering then create the user first
      if (mode === "register") {
        await register(name, email, password);
      }

      // login
      const tok = await login(email, password);
      localStorage.setItem("token", tok.access_token);

      const u = await me(tok.access_token);
      setUser(u);

      setStatus(mode === "register" ? "Account created & logged in!" : "Logged in!");
    } catch (err: any) {
      setStatus(err?.message ?? "Request failed");
    }
  }

  return (
    <main className="app-background">
      <div className="hero">

        {/* top */}
        <div className="hero-top">
          <img className="logo" src={logo} alt="SprintWheel logo" />

          <p className="tagline">
            SprintWheel is your agile project management tool designed to streamline
            your workflow and enhance team collaboration.
          </p>
        </div>

        {/* center */}
        <div className="hero-center">
          <div className="login-card">
            <h2 className="card-title">
              {mode === "login" ? "Welcome back!" : "Create account"}
            </h2>
            <p className="card-subtitle">
              {mode === "login" ? "Sign in to continue" : "Sign up to get started"}
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label className="field">
                  <span className="label">Name</span>
                  <Banner value={name} onChange={(e)=>setName(e.target.value)} required />
                </label>
              )}

              <label className="field">
                <span className="label">Email</span>
                <Banner value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
              </label>

              <label className="field">
                <span className="label">Password</span>
                <Banner value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required />
              </label>

              <button className="primary-btn" type="submit">
                {mode === "login" ? "Sign in" : "Create account"}
              </button>

              <div style={{ marginTop: 14, textAlign: "center" }}>
                {mode === "login" ? (
                  <button type="button" className="switch" onClick={()=>setMode("register")}>
                    New here? Create an account
                  </button>
                ) : (
                  <button type="button" className="switch" onClick={()=>setMode("login")}>
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </form>

            {status && <div className="status">{status}</div>}
          </div>
        </div>

        {/* bottom */}
        <div className="footer">
          <h1 className="brand">SprintWheel</h1>
          <p className="byline">Presented by: Stack Overthrow</p>
        </div>

      </div>
    </main>
  );
}

export default App;
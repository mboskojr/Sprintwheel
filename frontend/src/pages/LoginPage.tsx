/* import "../App.css";
import Banner from "../Banner";
import logo from "../assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, me, register, googleLogin } from "../api/auth";
import { GoogleLogin } from "@react-oauth/google";
import { listProjects, type ProjectRole } from "../api/projects";

function roleToUrlKey(role: string): string {
  switch (role) {
    case "Product Owner":
      return "product-owner";
    case "Scrum Facilitator":
      return "scrum-facilitator";
    case "Developer":
    default:
      return "developer";
  }
}

function roleKeyToLanding(roleKey: string): string {
  switch (roleKey) {
    case "product-owner":
      return "product-owner-dashboard";
    case "scrum-facilitator":
      return "scrum-facilitator-dashboard";
    case "developer":
    default:
      return "developer-dashboard";
  }
}

function isValidPrimaryRole(
  role: string | null | undefined
): role is ProjectRole {
  return (
    role === "Product Owner" ||
    role === "Scrum Facilitator" ||
    role === "Developer"
  );
}

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  async function routeAfterAuth() {
    const projects = await listProjects();

    if (!projects.length) {
      navigate("/new-project", { replace: true });
      return;
    }

    const first = projects[0];
    const projectId = first.id;
    const roleFromApi = first.role;

    if (!isValidPrimaryRole(roleFromApi)) {
      navigate(`/projects/${projectId}/role-options`, { replace: true });
      return;
    }

    const roleKey = roleToUrlKey(roleFromApi);
    const landing = roleKeyToLanding(roleKey);

    sessionStorage.removeItem("dashboard_revealed");
    navigate(`/projects/${projectId}/${roleKey}/${landing}`, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setUser(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      setStatus("Please fill in all required fields.");
      return;
    }

    if (mode === "register") {
      if (!trimmedName) {
        setStatus("Please enter your name.");
        return;
      }

      if (trimmedPassword.length < 8) {
        setStatus("Password must be at least 8 characters.");
        return;
      }

      if (trimmedPassword.length > 72) {
        setStatus("Password must be 72 characters or fewer.");
        return;
      }
    }

    try {
      if (mode === "register") {
        await register(trimmedName, trimmedEmail, trimmedPassword);
      }

      const tok = await login(trimmedEmail, trimmedPassword);
      localStorage.setItem("token", tok.access_token);

      const u = await me(tok.access_token);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);

      setStatus(mode === "register" ? "Account created & logged in!" : "Logged in!");
      await routeAfterAuth();
    } catch (err: any) {
      setStatus(err?.message ?? "Request failed");
    }
  }

  return (
    <main className="app-background">
      <div className="hero">
        <div className="hero-top">
          <img className="logo" src={logo} alt="SprintWheel logo" />

          <p className="tagline">
            SprintWheel is your agile project management tool designed to streamline
            your workflow and enhance team collaboration.
          </p>
        </div>

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
                  <Banner
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="field">
                <span className="label">Email</span>
                <Banner
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </label>

              <label className="field">
                <span className="label">Password</span>
                <Banner
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                />
              </label>

              <button className="primary-btn" type="submit">
                {mode === "login" ? "Sign in" : "Create account"}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "18px 0",
                  opacity: 0.95,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  OR
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
              </div>

              {mode === "login" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    transform: "scale(1.15)",
                  }}
                >
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        const idToken = credentialResponse.credential;
                        if (!idToken) return;

                        const token = await googleLogin(idToken);
                        localStorage.setItem("token", token.access_token);

                        const u = await me(token.access_token);
                        localStorage.setItem("user", JSON.stringify(u));
                        setUser(u);

                        sessionStorage.removeItem("dashboard_revealed");
                        await routeAfterAuth();
                      } catch (err: any) {
                        setStatus(err?.message ?? "Google login failed");
                      }
                    }}
                    onError={() => {
                      setStatus("Google login failed");
                    }}
                    size="large"
                    width="360"
                  />
                </div>
              )}

              <div style={{ marginTop: 14, textAlign: "center" }}>
                {mode === "login" ? (
                  <button
                    type="button"
                    className="switch"
                    onClick={() => setMode("register")}
                  >
                    New here? Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    className="switch"
                    onClick={() => setMode("login")}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </form>

            {status && <div className="status">{status}</div>}
          </div>
        </div>

        <div className="footer">
          <h1 className="brand">SprintWheel</h1>
          <p className="byline">Presented by: Stack Overthrow</p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage; */ 


import "../App.css";
import Banner from "../Banner";
import logo from "../assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, me, register, googleLogin } from "../api/auth";
import { GoogleLogin } from "@react-oauth/google";
import { listProjects, type ProjectRole } from "../api/projects";

function roleToUrlKey(role: string): string {
  switch (role) {
    case "Product Owner":
      return "product-owner";
    case "Scrum Facilitator":
      return "scrum-facilitator";
    case "Developer":
    default:
      return "developer";
  }
}

function roleKeyToLanding(roleKey: string): string {
  switch (roleKey) {
    case "product-owner":
      return "product-owner-dashboard";
    case "scrum-facilitator":
      return "scrum-facilitator-dashboard";
    case "developer":
    default:
      return "developer-dashboard";
  }
}

function isValidPrimaryRole(
  role: string | null | undefined
): role is ProjectRole {
  return (
    role === "Product Owner" ||
    role === "Scrum Facilitator" ||
    role === "Developer"
  );
}

// Animated Ollie the Octopus for the login page
function OllieLoginMascot() {
  return (
    <>
      <style>{`
        @keyframes ollie-float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes ollie-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.08); }
        }
        @keyframes tentacle-wave-1 {
          0%, 100% { d: path("M16 38 Q12 44 14 50 Q16 56 13 60"); }
          50% { d: path("M16 38 Q10 43 13 49 Q16 55 11 59"); }
        }
        @keyframes ollie-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(127,119,221,0.5)); }
          50% { filter: drop-shadow(0 0 18px rgba(127,119,221,0.9)); }
        }
        @keyframes tentacle-1 {
          0%, 100% { transform: rotate(0deg); transform-origin: 16px 38px; }
          50% { transform: rotate(-8deg); transform-origin: 16px 38px; }
        }
        @keyframes tentacle-2 {
          0%, 100% { transform: rotate(0deg); transform-origin: 21px 42px; }
          50% { transform: rotate(6deg); transform-origin: 21px 42px; }
        }
        @keyframes tentacle-3 {
          0%, 100% { transform: rotate(0deg); transform-origin: 27px 44px; }
          33% { transform: rotate(-5deg); transform-origin: 27px 44px; }
          66% { transform: rotate(5deg); transform-origin: 27px 44px; }
        }
        @keyframes tentacle-4 {
          0%, 100% { transform: rotate(0deg); transform-origin: 33px 44px; }
          33% { transform: rotate(5deg); transform-origin: 33px 44px; }
          66% { transform: rotate(-5deg); transform-origin: 33px 44px; }
        }
        @keyframes tentacle-5 {
          0%, 100% { transform: rotate(0deg); transform-origin: 39px 42px; }
          50% { transform: rotate(-6deg); transform-origin: 39px 42px; }
        }
        @keyframes tentacle-6 {
          0%, 100% { transform: rotate(0deg); transform-origin: 44px 38px; }
          50% { transform: rotate(8deg); transform-origin: 44px 38px; }
        }

        .ollie-login-wrap {
          animation: ollie-float 3.5s ease-in-out infinite, ollie-glow 3.5s ease-in-out infinite;
          display: inline-block;
        }
        .ollie-eye-left {
          animation: ollie-blink 4s ease-in-out infinite;
          transform-origin: 26px 24px;
        }
        .ollie-eye-right {
          animation: ollie-blink 4s ease-in-out infinite 0.1s;
          transform-origin: 38px 24px;
        }
        .ollie-t1 { animation: tentacle-1 2.2s ease-in-out infinite; }
        .ollie-t2 { animation: tentacle-2 2.5s ease-in-out infinite 0.2s; }
        .ollie-t3 { animation: tentacle-3 2.1s ease-in-out infinite 0.1s; }
        .ollie-t4 { animation: tentacle-4 2.1s ease-in-out infinite 0.3s; }
        .ollie-t5 { animation: tentacle-5 2.5s ease-in-out infinite 0.15s; }
        .ollie-t6 { animation: tentacle-6 2.2s ease-in-out infinite 0.05s; }
      `}</style>
      <div className="ollie-login-wrap">
        <svg
          width="90"
          height="90"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="32" cy="26" rx="18" ry="16" fill="#7f77dd" />
          <ellipse cx="26" cy="20" rx="6" ry="4" fill="#afa9ec" opacity="0.5" />

          <circle cx="26" cy="24" r="4" fill="white" className="ollie-eye-left" />
          <circle cx="38" cy="24" r="4" fill="white" className="ollie-eye-right" />
          <circle cx="27" cy="24" r="2" fill="#1a1a2e" className="ollie-eye-left" />
          <circle cx="39" cy="24" r="2" fill="#1a1a2e" className="ollie-eye-right" />
          <circle cx="28" cy="23" r="0.8" fill="white" className="ollie-eye-left" />
          <circle cx="40" cy="23" r="0.8" fill="white" className="ollie-eye-right" />

          <path
            d="M27 30 Q32 34 37 30"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="22" cy="28" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />
          <ellipse cx="42" cy="28" rx="3" ry="1.5" fill="#ed93b1" opacity="0.6" />

          <g className="ollie-t1">
            <path d="M16 38 Q12 44 14 50 Q16 56 13 60" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="13" cy="60" r="2" fill="#534ab7" />
          </g>
          <g className="ollie-t2">
            <path d="M21 42 Q19 48 21 54 Q23 58 20 62" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="20" cy="62" r="2" fill="#534ab7" />
          </g>
          <g className="ollie-t3">
            <path d="M27 44 Q27 50 29 56 Q30 60 28 63" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="28" cy="63" r="2" fill="#534ab7" />
          </g>
          <g className="ollie-t4">
            <path d="M33 44 Q35 50 33 56 Q32 60 34 63" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="34" cy="63" r="2" fill="#534ab7" />
          </g>
          <g className="ollie-t5">
            <path d="M39 42 Q41 48 39 54 Q37 58 40 62" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="40" cy="62" r="2" fill="#534ab7" />
          </g>
          <g className="ollie-t6">
            <path d="M44 38 Q48 44 46 50 Q44 56 47 60" stroke="#7f77dd" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="47" cy="60" r="2" fill="#534ab7" />
          </g>
        </svg>
      </div>
    </>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<string>("");
  const [/*user*/, setUser] = useState<any>(null);
  //removed unused "user" , unused terms prevent deployer from building application

  async function routeAfterAuth() {
    const projects = await listProjects();

    if (!projects.length) {
      navigate("/new-project", { replace: true });
      return;
    }

    const first = projects[0];
    const projectId = first.id;
    const roleFromApi = first.role;

    if (!isValidPrimaryRole(roleFromApi)) {
      navigate(`/projects/${projectId}/role-options`, { replace: true });
      return;
    }

    const roleKey = roleToUrlKey(roleFromApi);
    const landing = roleKeyToLanding(roleKey);

    sessionStorage.removeItem("dashboard_revealed");
    navigate(`/projects/${projectId}/${roleKey}/${landing}`, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setUser(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      setStatus("Please fill in all required fields.");
      return;
    }

    if (mode === "register") {
      if (!trimmedName) {
        setStatus("Please enter your name.");
        return;
      }

      if (trimmedPassword.length < 8) {
        setStatus("Password must be at least 8 characters.");
        return;
      }

      if (trimmedPassword.length > 72) {
        setStatus("Password must be 72 characters or fewer.");
        return;
      }
    }

    try {
      if (mode === "register") {
        await register(trimmedName, trimmedEmail, trimmedPassword);
      }

      const tok = await login(trimmedEmail, trimmedPassword);
      localStorage.setItem("token", tok.access_token);

      const u = await me(tok.access_token);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);

      setStatus(mode === "register" ? "Account created & logged in!" : "Logged in!");
      await routeAfterAuth();
    } catch (err: any) {
      setStatus(err?.message ?? "Request failed");
    }
  }

  return (
    <main className="app-background">
      <div className="hero">
        <div className="hero-top">
          <img className="logo" src={logo} alt="SprintWheel logo" />

          <p className="tagline">
            SprintWheel is your agile project management tool designed to streamline
            your workflow and enhance team collaboration.
          </p>
        </div>

        <div className="hero-center">
          <div className="login-card">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: 8,
                marginTop: -8,
              }}
            >
              <OllieLoginMascot />
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 16,
                  color: "rgba(235, 230, 255, 0.98)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)",
                }}
              >
                {mode === "login"
                  ? "Ollie's happy to see you! 🐙"
                  : "Ollie's excited to meet you! 🐙"}
              </p>
            </div>

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
                  <Banner
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="field">
                <span className="label">Email</span>
                <Banner
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </label>

              <label className="field">
                <span className="label">Password</span>
                <Banner
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                />
              </label>

              {mode === "login" && (
                <div style={{ marginTop: 6, marginBottom: 14, textAlign: "right" }}>
                  <button
                    type="button"
                    className="switch"
                    onClick={() => navigate("/forgot-password")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(235, 230, 255, 0.95)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button className="primary-btn" type="submit">
                {mode === "login" ? "Sign in" : "Create account"}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "18px 0",
                  opacity: 0.95,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  OR
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.25)",
                  }}
                />
              </div>

              {mode === "login" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    transform: "scale(1.15)",
                  }}
                >
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        const idToken = credentialResponse.credential;
                        if (!idToken) return;

                        const token = await googleLogin(idToken);
                        localStorage.setItem("token", token.access_token);

                        const u = await me(token.access_token);
                        localStorage.setItem("user", JSON.stringify(u));
                        setUser(u);

                        sessionStorage.removeItem("dashboard_revealed");
                        await routeAfterAuth();
                      } catch (err: any) {
                        setStatus(err?.message ?? "Google login failed");
                      }
                    }}
                    onError={() => {
                      setStatus("Google login failed");
                    }}
                    size="large"
                    width="360"
                  />
                </div>
              )}

              <div style={{ marginTop: 14, textAlign: "center" }}>
                {mode === "login" ? (
                  <button
                    type="button"
                    className="switch"
                    onClick={() => setMode("register")}
                  >
                    New here? Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    className="switch"
                    onClick={() => setMode("login")}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </form>

            {status && <div className="status">{status}</div>}
          </div>
        </div>

        <div className="footer">
          <h1 className="brand">SprintWheel</h1>
          <p className="byline">Presented by: Stack Overthrow</p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
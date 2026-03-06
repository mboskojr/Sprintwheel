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
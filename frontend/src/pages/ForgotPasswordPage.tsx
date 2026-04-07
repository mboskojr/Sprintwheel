import "../App.css";
import Banner from "../Banner";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "../api/auth";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");

    if (!email.trim()) {
      setStatus("Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setStatus("If an account exists for that email, a reset link has been sent.");
    } catch (err: any) {
      setStatus(err?.message ?? "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-background">
      <div className="hero">
        <div className="hero-center">
          <div className="login-card">
            <h2 className="card-title">Reset password</h2>
            <p className="card-subtitle">
              Enter your email and we’ll send you a reset link.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="label">Email</span>
                <Banner
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </label>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            {status && <div className="status">{status}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
import "../App.css";
import Banner from "../Banner";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!token) {
      setStatus("Missing or invalid reset token.");
      return;
    }

    if (!newPassword.trim()) {
      setStatus("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    if (newPassword.length > 72) {
      setStatus("Password must be 72 characters or fewer.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, newPassword);
      setStatus("Password reset successful. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setStatus(err?.message ?? "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-background">
      <div className="hero">
        <div className="hero-center">
          <div className="login-card">
            <h2 className="card-title">Choose a new password</h2>
            <p className="card-subtitle">
              Enter your new password below.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="label">New password</span>
                <Banner
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  required
                />
              </label>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>

            {status && <div className="status">{status}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ResetPasswordPage;
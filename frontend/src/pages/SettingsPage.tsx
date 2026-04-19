import { useEffect, useState, type CSSProperties, type JSX } from "react";
import SidebarLayout from "../components/SidebarLayout";
import { useTheme } from "./ThemeContext";

const API_BASE =
  import.meta.env.VITE_API_URL?.trim() || "https://sprintwheel.onrender.com";

export default function SettingsPage(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const styles: Record<string, CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: isDark ? "#0b0f17" : "#f8fafc",
      color: isDark ? "white" : "#111827",
      padding: "40px 24px",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      maxWidth: "1100px",
      margin: "0 auto",
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: 700,
      margin: 0,
      color: isDark ? "white" : "#111827",
    },
    subtitle: {
      fontSize: "1rem",
      color: isDark ? "#d1d5db" : "#4b5563",
      marginTop: 10,
      lineHeight: 1.6,
      maxWidth: "750px",
    },
    topActions: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginTop: 20,
    },
    primaryButton: {
      backgroundColor: "#7c3aed",
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "12px 18px",
      fontSize: "0.95rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      color: isDark ? "white" : "#111827",
      border: isDark
        ? "1px solid rgba(255,255,255,0.18)"
        : "1px solid rgba(17,24,39,0.14)",
      borderRadius: 12,
      padding: "12px 18px",
      fontSize: "0.95rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 20,
      marginTop: 28,
    },
    card: {
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.06)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(17,24,39,0.08)",
      borderRadius: 20,
      padding: 20,
      boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    },
    cardTitle: {
      fontSize: "1.2rem",
      fontWeight: 700,
      margin: "0 0 8px 0",
      color: isDark ? "white" : "#111827",
    },
    cardText: {
      color: isDark ? "#d1d5db" : "#4b5563",
      fontSize: "0.95rem",
      lineHeight: 1.5,
      marginBottom: 16,
    },
    buttonRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    },
    smallButton: {
      backgroundColor: "#7c3aed",
      color: "white",
      border: "none",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.9rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    outlineButton: {
      backgroundColor: "transparent",
      color: isDark ? "white" : "#111827",
      border: isDark
        ? "1px solid rgba(255,255,255,0.16)"
        : "1px solid rgba(17,24,39,0.14)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.9rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    quickSettings: {
      marginTop: 24,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16,
    },
    quickCard: {
      background: isDark ? "rgba(161, 3, 252, 0.12)" : "rgba(161, 3, 252, 0.08)",
      border: isDark
        ? "1px solid rgba(161, 3, 252,0.28)"
        : "1px solid rgba(161, 3, 252,0.18)",
      borderRadius: 16,
      padding: 18,
    },
    quickTitle: {
      margin: "0 0 8px 0",
      fontSize: "1rem",
      fontWeight: 700,
      color: isDark ? "white" : "#111827",
    },
    quickText: {
      margin: "0 0 14px 0",
      color: isDark ? "#f3f4f6" : "#4b5563",
      fontSize: "0.92rem",
      lineHeight: 1.4,
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 14,
    },
    label: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: isDark ? "#f3f4f6" : "#374151",
    },
    input: {
      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.06)",
      color: isDark ? "white" : "#111827",
      border: isDark
        ? "1px solid rgba(255,255,255,0.14)"
        : "1px solid rgba(17,24,39,0.14)",
      borderRadius: 10,
      padding: "12px 14px",
      fontSize: "0.95rem",
      outline: "none",
    },
    disabledInput: {
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.04)",
      color: isDark ? "#d1d5db" : "#6b7280",
      border: isDark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(17,24,39,0.1)",
      borderRadius: 10,
      padding: "12px 14px",
      fontSize: "0.95rem",
    },
    successText: {
      color: "#86efac",
      fontSize: "0.9rem",
      margin: 0,
    },
    errorText: {
      color: "#fca5a5",
      fontSize: "0.9rem",
      margin: 0,
    },
  };

  const [account, setAccount] = useState({
    name: "",
    email: "",
    role: "",
    newName: "",
    nameCurrentPassword: "",
    passwordCurrentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setLoadError("Failed to load account info.");
          return;
        }

        const data = await res.json();
        setAccount((prev) => ({
          ...prev,
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role ?? "",
        }));
      } catch {
        setLoadError("Error loading account info.");
      }
    };

    fetchAccount();
  }, []);

  const handleNameChange = async () => {
    setNameMessage("");
    setNameError("");

    if (!account.nameCurrentPassword) {
      setNameError("Please enter your current password.");
      return;
    }

    if (!account.newName.trim()) {
      setNameError("Please enter a new name.");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE}/auth/change-name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: account.nameCurrentPassword,
          new_name: account.newName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNameError(data.detail || "Failed to change name.");
        return;
      }

      setNameMessage(data.message || "Name updated successfully.");
      setAccount((prev) => ({
        ...prev,
        name: account.newName,
        newName: "",
        nameCurrentPassword: "",
      }));
    } catch {
      setNameError("Error changing name.");
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage("");
    setPasswordError("");

    if (
      !account.passwordCurrentPassword ||
      !account.newPassword ||
      !account.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (account.newPassword !== account.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: account.passwordCurrentPassword,
          new_password: account.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.detail || "Failed to change password.");
        return;
      }

      setPasswordMessage(data.message || "Password updated successfully.");
      setAccount((prev) => ({
        ...prev,
        passwordCurrentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch {
      setPasswordError("Error changing password.");
    }
  };

  return (
    <SidebarLayout>
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Settings</h1>
            <p style={styles.subtitle}>
              Manage your personal preferences, account details, notifications,
              permissions, and workspace experience all in one place.
            </p>
            <div style={styles.topActions}>
              <button style={styles.primaryButton}>Save Changes</button>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  if (theme !== "dark") {
                    toggleTheme();
                  }
                }}
              >
                Reset to Default
              </button>
            </div>
          </div>

          <div style={styles.quickSettings}>
            <div style={styles.quickCard}>
              <h3 style={styles.quickTitle}>Appearance</h3>
              <p style={styles.quickText}>
                Toggle between light and dark mode for a more personalized
                experience.
              </p>
              <button style={styles.smallButton} onClick={toggleTheme}>
                {theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"}
              </button>
            </div>

            {/*
            <div style={styles.quickCard}>
              <h3 style={styles.quickTitle}>Dashboard Layout</h3>
              <p style={styles.quickText}>
                Customize the widgets and layout that appear on your dashboard.
              </p>
              <button style={styles.smallButton}>Customize Layout</button>
            </div>
            */}

            {/*
            <div style={styles.quickCard}>
              <h3 style={styles.quickTitle}>Integrations</h3>
              <p style={styles.quickText}>
                Connect external tools and manage app integrations for your team.
              </p>
              <button style={styles.smallButton}>Manage Integrations</button>
            </div>
            */}

            {/*
            <div style={styles.quickCard}>
              <h3 style={styles.quickTitle}>Permissions</h3>
              <p style={styles.quickText}>
                Review team roles, access control settings, and workspace security.
              </p>
              <button style={styles.smallButton}>View Access Controls</button>
            </div>
            */}
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>User Profile</h2>
              <p style={styles.cardText}>
                Update your name and other personal account details.
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Name</label>
                <input
                  style={styles.disabledInput}
                  type="text"
                  value={account.name}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={account.nameCurrentPassword}
                  onChange={(e) =>
                    setAccount({
                      ...account,
                      nameCurrentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Name</label>
                <input
                  style={styles.input}
                  type="text"
                  value={account.newName}
                  onChange={(e) =>
                    setAccount({ ...account, newName: e.target.value })
                  }
                />
              </div>

              <div style={styles.buttonRow}>
                <button style={styles.smallButton} onClick={handleNameChange}>
                  Change Name
                </button>
                {nameMessage && <p style={styles.successText}>{nameMessage}</p>}
                {nameError && <p style={styles.errorText}>{nameError}</p>}
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Account Settings</h2>
              <p style={styles.cardText}>
                View your account information and update your password.
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Name</label>
                <input
                  style={styles.disabledInput}
                  type="text"
                  value={account.name}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.disabledInput}
                  type="email"
                  value={account.email}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <input
                  style={styles.disabledInput}
                  type="text"
                  value={account.role}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={account.passwordCurrentPassword}
                  onChange={(e) =>
                    setAccount({
                      ...account,
                      passwordCurrentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={account.newPassword}
                  onChange={(e) =>
                    setAccount({ ...account, newPassword: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={account.confirmPassword}
                  onChange={(e) =>
                    setAccount({
                      ...account,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div style={styles.buttonRow}>
                <button
                  style={styles.smallButton}
                  onClick={handlePasswordChange}
                >
                  Change Password
                </button>
                {passwordMessage && (
                  <p style={styles.successText}>{passwordMessage}</p>
                )}
                {passwordError && (
                  <p style={styles.errorText}>{passwordError}</p>
                )}
              </div>
            </div>
          </div>

          {loadError && (
            <p style={{ ...styles.errorText, marginTop: 16 }}>{loadError}</p>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
import { linearGradient } from "framer-motion/client";
import type {CSSProperties, JSX} from "react";
import { useNavigate } from "react-router-dom";

const pageStyle: CSSProperties = {
    height: "100vh",
    //background: "linear-gradient(135deg, #0f172a, #1e293b)",
    background: "linear-gradient(135deg, #2d3a7a, #3a5499)",
    //background: "#2d3a7a",
    //background: "radial-gradient(circle, #7b8fe8, #2d3a7a)", 
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontFamily: "Inter, sans-serif",
};

const titleStyle: CSSProperties = {
    fontSize: "2.5rem",
    marginBottom: "10px",
};

const subtitleStyle: CSSProperties = {
    color: "#94a3b8",
    marginBottom: "40px",
};

const buttonContainer: CSSProperties = {
  display: "flex",
  gap: "20px",
};

const buttonStyle: CSSProperties = {
  padding: "14px 28px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export default function RoleOptionsPage(): JSX.Element {
    const navigate = useNavigate();

      return (
        <div style={pageStyle}>

            {/* Close button */}
            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                }}
            > 
                ✕ Close
            </button>
            <h1 style={titleStyle}>Choose Your Role</h1>
            <p style={subtitleStyle}>
                Select your role for BLANK project
            </p>

            <div style={buttonContainer}>
                <button style={buttonStyle}
                onClick={() => navigate("/product-owner")}
                >
                    Product Owner
                </button>
                
                <button style={buttonStyle}
                onClick={() => navigate("/scrum-facilitator")}
                >
                    Scrum Master
                </button>

                <button style={buttonStyle}
                onClick={() => navigate("/team-member")}
                >
                    Team Member
                </button>
            </div>
        </div>

      );
}
        {/*<div style={{ color: "white", padding: 40 }}>
            <h1>Role Options Page</h1>
            <p>new page!</p>
        </div>*/}

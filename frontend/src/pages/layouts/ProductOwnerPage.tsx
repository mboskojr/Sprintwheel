import type { CSSProperties, JSX} from "react";
import SidebarLayout from "../../components/SidebarLayout";

{/*const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, sans-serif",
};*/}

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1100px",
  padding: "40px",
};

const heroStyle: CSSProperties = {
  marginBottom: "40px",
};

const titleStyle: CSSProperties = {
  fontSize: "2.5rem",
  marginBottom: "10px",
};

const subtitleStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "1.1rem",
};



export default function ProductOwnerPage(): JSX.Element {
    return (
        <SidebarLayout>
            <div style={containerStyle}>
                <header style={heroStyle}>
                    <h1 style={titleStyle}>Product Owner Dashboard</h1>
                    <p style={subtitleStyle}>
                        Your personalized PO dashboard.
                    </p>
                </header>
            </div>
        </SidebarLayout>
    );
}




        {/*<div style={pageStyle}>
            <div style={containerStyle}>
                <header style={heroStyle}>
                    <h1 style={titleStyle}>Product Owner Dashboard</h1>
                    <p style={subtitleStyle}>
                        Your personalized PO dashboard.
                    </p>
                </header>
            </div>
        </div>*/}
        
    

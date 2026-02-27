import { useState } from "react";
import type { CSSProperties, ReactNode, JSX } from "react";

const styles: Record<string, CSSProperties> = {
    shell: {
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#0b0f17",
        color: "white",
    },
    sidebar: {
        display: "flex",
        flexDirection: "column",
        padding: 14,
        background: "#0a0e16",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        transition: "width 0.2s ease",
        overflow: "hidden",
    },
    sidebarTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    brand: { margin: 0, fontSize: 18, fontWeight: 700 },
    collapseBtn: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "white",
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
    },
    nav: { display: "flex", flexDirection: "column", gap: 12 },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        background: "rgba(255,255,255,0.06)",
    },
    icon: { fontSize: 20, width: 28, textAlign: "center" },
    navLabel: { fontSize: 14, fontWeight: 600 },
    main: { flex: 1, padding: 24, overflow: "auto" },
};

function NavItem({
    icon,
    label,
    collapsed,
}: {
    icon: string;
    label: string;
    collapsed: boolean;
}): JSX.Element {
    return (
        <div style={styles.navItem} title={collapsed ? label : undefined}>
            <span style={styles.icon}>{icon}</span>
            {!collapsed && <span style={styles.navLabel}>{label}</span>}
        </div>
    );
}

export default function SidebarLayout({
    children,
}: {
    children: ReactNode;
}): JSX.Element {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div style={styles.shell}>
            <aside
                style={{
                    ...styles.sidebar,
                    width: collapsed ? 60 : 200,
                }}
                >
                    {/* sidebar header (keeping it cute + simple) */}
                    <div style={styles.sidebarTop}>
                        {!collapsed && <h2 style={styles.brand}>SprintWheel</h2>}
                        <button
                            style={styles.collapseBtn}
                            onClick={() => setCollapsed(!collapsed)}
                            aria-label="toggle sidebar"
                            >
                                {collapsed ? ">" : "<"}
                            </button>
                    </div>
                    
                    {/* sidebar nav (these are placeholders for now) */}
                    <nav style={styles.nav}>
                        <NavItem icon="📝" label="To-Do / Planning" collapsed={collapsed} />
                        <NavItem icon="📧" label="Communication" collapsed={collapsed} />
                        <NavItem icon="📊" label="Progress" collapsed={collapsed} />
                        <NavItem icon="📌" label="Project Details" collapsed={collapsed} />
                        <NavItem icon="🧠" label="Education" collapsed={collapsed} />
                        <NavItem icon="⚙️" label="Settings" collapsed={collapsed} />
                    </nav>
                </aside>

                <main style={styles.main}>{children}</main>
            </div>
    )
}
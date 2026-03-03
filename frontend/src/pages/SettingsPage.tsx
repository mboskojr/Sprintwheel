import type { CSSProperties, JSX} from "react";

export default function SettingsPage(): JSX.Element {
    return (
        <div style={{ color: "white", padding: 40 }}>
            <h1>Settings</h1>
            <p>This is the Settings page.</p>
            <p> This is where the User Profile, Notification Preferences, & Account Settings will live</p>
            <p>Consdirations: Light/Dark Mode </p>
            <p>Other considerations: Custom Dashboard Layout, Integrations, Team Permissions & Access Controls.</p>
            <p>User Profile</p>
            <img src="/user_profile_placeholder.png" alt="User Profile showing user's name, profile picture, and basic information" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Notification Preferences</p>
            <img src="/notification_preferences_placeholder.png" alt="Notification Preferences showing options for email and in-app notifications" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
            <p>Account Settings</p>
            <img src="/account_settings_placeholder.png" alt="Account Settings showing options for changing password, managing connected accounts, and deleting account" style={{ maxWidth: "100%", height: "auto", marginTop: 20 }} />
        </div>
    );
}

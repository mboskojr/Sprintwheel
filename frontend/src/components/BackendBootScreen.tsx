type BackendBootScreenProps = {
  timedOut?: boolean;
  onRetry?: () => void | Promise<void>;
};

export default function BackendBootScreen({
  timedOut = false,
  onRetry,
}: BackendBootScreenProps) {
  return (
    <>
      <style>
        {`
          @keyframes sprintwheel-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{
          background:
            "linear-gradient(135deg, #0b0f17 0%, #111827 45%, #1e293b 100%)",
        }}
      >
        <div
          className="w-full max-w-xl rounded-3xl shadow-2xl p-8 md:p-10 text-white"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "3px solid #67e8f9",
                  borderTop: "3px solid transparent",
                  animation: "sprintwheel-spin 1s linear infinite",
                }}
              />
            </div>

            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                SprintWheel
              </h1>

              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.65)",
                  margin: "4px 0 0 0",
                }}
              >
                Preparing your workspace
              </p>
            </div>
          </div>

          {!timedOut ? (
            <>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Getting things ready
              </h2>

              <p
                style={{
                  marginTop: 12,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.7,
                  fontSize: 16,
                }}
              >
                Just a moment while we connect everything.
              </p>

              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    height: 8,
                    width: "100%",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "35%",
                      borderRadius: 999,
                      background: "#67e8f9",
                    }}
                    className="animate-pulse"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Still connecting
              </h2>

              <p
                style={{
                  marginTop: 12,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.7,
                  fontSize: 16,
                }}
              >
                We’re having trouble reaching the server right now.
              </p>

              <button
                onClick={onRetry}
                style={{
                  marginTop: 24,
                  borderRadius: 16,
                  padding: "12px 20px",
                  background: "#67e8f9",
                  color: "#0f172a",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
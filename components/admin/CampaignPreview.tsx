type Props = {
  campaign: any;
};

export default function CampaignPreview({ campaign }: Props) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* ================= COMERCIO ================= */}
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: "#64748b" }}>
          Vista comercio
        </div>

        <div
          style={{
            width: 380,
            height: 520,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            display: "flex",
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: 110,
              background: campaign.color_sidebar || "#111827",
              color: "#fff",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              {campaign.logo_comercio_url ? (
                <img
                  src={campaign.logo_comercio_url}
                  style={{ maxWidth: 70 }}
                />
              ) : (
                <div style={{ fontSize: 12 }}>LOGO</div>
              )}
            </div>

            {["Dashboard", "Terminal", "Usuarios", "Notificaciones"].map(
              (item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    background:
                      i === 0
                        ? campaign.color_activo || "#2563eb"
                        : "transparent",
                    fontSize: 12,
                  }}
                >
                  {item}
                </div>
              )
            )}

            <div style={{ marginTop: "auto", textAlign: "center" }}>
              {campaign.logo_benefi_url && (
                <img
                  src={campaign.logo_benefi_url}
                  style={{ maxWidth: 70 }}
                />
              )}
              <div style={{ fontSize: 10, marginTop: 4 }}>
                {campaign.powered_by_texto || "Powered by BENEFI"}
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div
            style={{
              flex: 1,
              padding: 12,
              background: campaign.color_fondo || "#f3f4f6",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {campaign.portal_titulo || "Portal comercio"}
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              {campaign.portal_descripcion || "Descripción del portal"}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 11 }}>Ventas</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>$120.000</div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 11 }}>Usuarios</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>124</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= USUARIO ================= */}
      <div>
        <div style={{ fontSize: 12, marginBottom: 6, color: "#64748b" }}>
          Vista usuario
        </div>

        <div
          style={{
            width: 260,
            height: 520,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            background: campaign.color_fondo || "#f3f4f6",
            padding: 12,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            {campaign.logo_comercio_url ? (
              <img src={campaign.logo_comercio_url} style={{ maxWidth: 90 }} />
            ) : (
              <div>LOGO</div>
            )}
          </div>

          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {campaign.portal_titulo || "Portal usuario"}
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
            {campaign.portal_descripcion || "Descripción"}
          </div>

          <div
            style={{
              background: campaign.color_activo || "#2563eb",
              color: "#fff",
              borderRadius: 12,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 11 }}>Tus puntos</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>350 pts</div>
          </div>

          <div style={{ fontSize: 12 }}>Movimientos: 6</div>

          <div
            style={{
              marginTop: "auto",
              fontSize: 10,
              color: "#6b7280",
            }}
          >
            {campaign.powered_by_texto || "Powered by BENEFI"}
          </div>
        </div>
      </div>
    </div>
  );
}
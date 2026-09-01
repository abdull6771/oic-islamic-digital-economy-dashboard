import {
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...styles.tooltip,
        animation: "fadeIn 0.2s ease-in",
      }}
    >
      <div
        style={{
          color: "#000000",
          fontWeight: 700,
          marginBottom: "8px",
          fontSize: "13px",
        }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            color: p.color || "#1E293B",
            marginBottom: "2px",
            fontSize: "12px",
          }}
        >
          <span style={{ fontWeight: 500 }}>{p.name}:</span>{" "}
          <span style={{ fontWeight: 700, color: p.color || "#000000" }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;

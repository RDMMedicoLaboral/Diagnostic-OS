export const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const nowISO = () => new Date().toISOString();

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
  );
};

export function initialsOf(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Íconos propios en SVG (sin dependencias externas) — reemplazan a lucide-react/Font Awesome
// para que el HTML final no necesite descargar nada de internet.
import React from "react";

const ICONSVG = {
  Activity: '<polyline points="3 12 8 12 10 18 14 6 16 12 21 12"/>',
  FlaskConical: '<path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
  ScanLine: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/>',
  Users: '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M3 20c0-3.3 2.8-5.5 6-5.5s6 2.2 6 5.5"/><path d="M14 15c2.3 0 5.5 1.4 5.5 5"/>',
  Share2: '<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><line x1="8" y1="11" x2="16" y2="7"/><line x1="8" y1="13" x2="16" y2="17"/>',
  Radio: '<circle cx="12" cy="12" r="2"/><path d="M7.5 9a6.5 6.5 0 0 0 0 6"/><path d="M16.5 9a6.5 6.5 0 0 1 0 6"/><path d="M4.5 5.5a11 11 0 0 0 0 13"/><path d="M19.5 5.5a11 11 0 0 1 0 13"/>',
  Plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  Search: '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.5" y2="15.5"/>',
  X: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
  CheckCircle2: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  Clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  AlertTriangle: '<path d="M12 3 2 20h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  ChevronRight: '<polyline points="9 5 16 12 9 19"/>',
  Stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M18 10v2a6 6 0 0 1-12 0v-2"/><circle cx="18" cy="8" r="2"/>',
  Building2: '<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="8" y1="7" x2="8" y2="7.01"/><line x1="12" y1="7" x2="12" y2="7.01"/><line x1="16" y1="7" x2="16" y2="7.01"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/>',
  LayoutDashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
  FileJson: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14 2 14 8 20 8"/>',
  Trash2: '<polyline points="3 6 5 6 21 6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  ArrowRight: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
  Bone: '<path d="M6 4.2a2 2 0 1 1 2.8 2.8L16 14.2a2 2 0 1 1 2.8 2.8 2 2 0 1 1-2.8-2.8L8.8 7A2 2 0 0 1 6 4.2z"/>',
  Waves: '<path d="M3 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0"/><path d="M3 14c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0"/><path d="M3 20c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0"/>',
  ClipboardList: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><rect x="9" y="1.3" width="6" height="3" rx="1"/><line x1="9" y1="9.5" x2="15" y2="9.5"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="16.5" x2="13" y2="16.5"/>',
  UserPlus: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><line x1="18" y1="6" x2="18" y2="12"/><line x1="15" y1="9" x2="21" y2="9"/>',
  Loader2: '<circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 0-9-9"/>',
  ChevronDown: '<polyline points="5 9 12 16 19 9"/>',
  Check: '<polyline points="4 12 9 17 20 6"/>',
  CalendarClock: '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><circle cx="16" cy="16" r="3.4"/><polyline points="16 14.3 16 16 17.4 16.8"/>',
  ArrowLeftRight: '<polyline points="17 4 21 8 17 12"/><line x1="3" y1="8" x2="21" y2="8"/><polyline points="7 20 3 16 7 12"/><line x1="3" y1="16" x2="21" y2="16"/>',
  ArrowDownToLine: '<line x1="12" y1="3" x2="12" y2="14"/><polyline points="7 10 12 15 17 10"/><line x1="5" y1="19" x2="19" y2="19"/>',
  KeyRound: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8 20 3M20 3v4h-4M16.5 6.5 19 9"/>',
  Pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  Link2: '<path d="M9 15 15 9"/><path d="M11 5 13.5 2.5a3.5 3.5 0 1 1 5 5L16 10"/><path d="M13 19l-2.5 2.5a3.5 3.5 0 1 1-5-5L8 14"/>',
  Settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
};

export default function Icon({ name, size = 16, color, className = "", style = {} }) {
  const inner = ICONSVG[name] || '<circle cx="12" cy="12" r="9"/>';
  return React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    style: { display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style },
    dangerouslySetInnerHTML: { __html: inner },
  });
}

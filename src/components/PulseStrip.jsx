import Icon from "./Icon.jsx";

export default function PulseStrip({ pulseKey }) {
  return (
    <div className="dos-pulse-strip">
      <div className="dos-pulse-left"><Icon name="Building2" size={13} /> Diagnostic OS</div>
      <div className="dos-pulse-track" />
      <div key={pulseKey} className={`dos-pulse-packet ${pulseKey ? "animate" : ""}`} />
      <div className="dos-pulse-right">HIS Central <Icon name="ArrowRight" size={12} /></div>
    </div>
  );
}

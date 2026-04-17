function ToggleButton({ active, count, icon, activeIcon, className, label, onClick }) {
  return (
    <button
      className={`card-action-btn ${className} ${active ? 'active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="action-icon">{active ? activeIcon : icon}</span>
      <span className="action-count">{count}</span>
    </button>
  )
}

export default ToggleButton

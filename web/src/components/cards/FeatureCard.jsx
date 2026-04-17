function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card brutal">
      <div className="feature-icon-wrap">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export default FeatureCard

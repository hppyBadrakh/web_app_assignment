function TeamMemberCard({ imgSrc, name, role }) {
  return (
    <div className="team-card brutal">
      <img src={imgSrc} alt={name} loading="lazy" />
      <p className="team-name">{name}</p>
      <p className="team-role">{role}</p>
    </div>
  )
}

export default TeamMemberCard

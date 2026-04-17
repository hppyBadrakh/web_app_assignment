import { useState } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'
import Modal from '../components/common/Modal'

const PAYMENTS = [
  { id: 1, name: 'Үндсэн багц', status: 'Идэвхтэй', amount: '₮29,900/сар', date: '2025-04-01', desc: 'Хязгааргүй шалгалт, аналитик, тэмцээн' },
  { id: 2, name: 'Математикийн шалгалт', status: 'Төлсөн', amount: '₮18,900', date: '2025-03-15', desc: '2024 оны загвар тест' },
  { id: 3, name: 'Физикийн шалгалт', status: 'Төлсөн', amount: '₮15,000', date: '2025-03-10', desc: '2024 оны загвар тест' },
]

function PaymentInfo() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal" style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 900, marginBottom: '8px' }}>💳 Төлбөрийн мэдээлэл</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Таны захиалга ба гүйлгээний түүх</p>

          <div style={{ background: '#e8f5e9', border: '2px solid #5eb562', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
            <h3 style={{ fontWeight: 900, color: '#5eb562', marginBottom: '6px' }}>✅ Идэвхтэй захиалга</h3>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Үндсэн багц — ₮29,900/сар</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Дараагийн төлбөр: 2025-05-01</p>
          </div>

          <h3 style={{ fontWeight: 900, marginBottom: '15px' }}>Гүйлгээний түүх</h3>
          <div className="payment-cards">
            {PAYMENTS.map(p => (
              <div key={p.id} className="payment-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{p.name}</h3>
                    <p style={{ color: '#666', fontSize: '0.85rem', fontWeight: 400 }}>📅 {p.date}</p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <p>{p.amount}</p>
                    <span className={`badge ${p.status === 'Идэвхтэй' ? 'green-badge' : 'gray'}`} style={{ marginBottom: 0 }}>
                      {p.status}
                    </span>
                    <button className="btn-brutal white-btn view-btn" onClick={() => setSelected(p)}>
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontWeight: 900 }}>🧾 Гүйлгээний дэлгэрэнгүй</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          {[
            ['Бүтээгдэхүүн', selected.name],
            ['Огноо', selected.date],
            ['Дүн', selected.amount],
            ['Статус', selected.status],
            ['Тайлбар', selected.desc],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ fontWeight: 700 }}>{label}:</span>
              <span>{val}</span>
            </div>
          ))}

          <button className="btn-brutal white-btn" style={{ marginTop: '24px' }} onClick={() => setSelected(null)}>Хаах</button>
        </Modal>
      )}
    </div>
  )
}

export default PaymentInfo

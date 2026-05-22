import { Helmet } from 'react-helmet-async'
import { useState } from 'react'

const GUIDES = [
  {
    id: 1, icon: '📝', title: 'Шалгалт өгөх заавар',
    steps: ['TestHub-д нэвтэрнэ', '"Шалгалтууд" хэсгээс шалгалтаа сонгоно', '"Эхлэх" товч дарж шалгалт өгнө', 'Дуусгасны дараа үр дүнгээ харна'],
  },
  {
    id: 2, icon: '🏆', title: 'Тэмцээнд бүртгүүлэх',
    steps: ['"Тэмцээн" цэснээс тэмцээнээ сонгоно', '"Дэлгэрэнгүй" дарж мэдээллийг уншина', '"Бүртгүүлэх" дарна', 'Тэмцээний өдөр цагт оролцоно'],
  },
  {
    id: 3, icon: '💳', title: 'Төлбөр төлөх заавар',
    steps: ['"Профайл" → "Төлбөрийн мэдээлэл" руу орно', 'Багц сонгоно', 'Банкны карт эсвэл QPay ашиглан төлнө', 'Баримтаа имэйлдээ хүлээн авна'],
  },
]

const FAQS = [
  { id: 1, q: 'Шалгалтыг хэдэн удаа өгч болох вэ?', a: 'Үндсэн багцтай хэрэглэгчид шалгалтыг хязгааргүй тооны удаа давтан өгч болно. Үнэгүй хэрэглэгчид тухайн шалгалтыг 3 удаа өгч болно.' },
  { id: 2, q: 'Интернет холболтгүй үед шалгалт өгч болох уу?', a: 'Одоогоор офлайн горим дэмждэггүй. Тогтвортой интернет холболт шаардлагатай. Бид удахгүй офлайн горим нэмэх төлөвлөгөөтэй байна.' },
  { id: 3, q: 'Гэрчилгээ хэрхэн авах вэ?', a: 'Шалгалтад 80%-иас дээш оноо авбал гэрчилгээ автоматаар олгогдоно. Гэрчилгээг PDF хэлбэрээр татаж, хуваалцах боломжтой.' },
]

function Help() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <main>
      <Helmet>
        <title>TestHub — Тусламж</title>
        <meta name="description" content="TestHub ашиглах заавар болон түгээмэл асуулт хариулт." />
        <meta property="og:title" content="TestHub — Тусламж" />
        <meta property="og:description" content="Тусламж ба заавар" />
        <meta property="og:image" content="/pictures/IMG_0894.svg" />
      </Helmet>
      <section className="hero-area-center container">
        <div className="page-icon">❓</div>
        <h1>Тусламжийн төв</h1>
        <p className="hero-sub">Асуулт байвал бид тусалахад бэлэн!</p>
      </section>

      <div className="container">
        <h2 className="section-title">Эхлэх заавар</h2>
        <div className="grid-3" style={{ marginBottom: '50px' }}>
          {GUIDES.map(g => (
            <div key={g.id} className="brutal" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{g.icon}</div>
              <h3 style={{ fontWeight: 900, marginBottom: '16px' }}>{g.title}</h3>
              <ol className="help-steps">
                {g.steps.map((step, i) => (
                  <li key={i}><span>{i + 1}</span>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <h2 className="section-title">Түгээмэл асуултууд</h2>
        <div className="faq-container" style={{ marginBottom: '50px' }}>
          {FAQS.map(faq => (
            <div key={faq.id} className="faq-item brutal">
              <div
                className="faq-header"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <span>{faq.q}</span>
                <span style={{ transform: openFaq === faq.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', display: 'inline-block', flexShrink: 0, marginLeft: '12px' }}>▼</span>
              </div>
              {openFaq === faq.id && (
                <div className="faq-content"><p>{faq.a}</p></div>
              )}
            </div>
          ))}
        </div>

        <div className="support-banner brutal" style={{ padding: '40px' }}>
          <h3>📞 Дэмжлэг хэрэгтэй юу?</h3>
          <p>Манай баг танд туслахад бэлэн байна. Доорх имэйл рүү хандаарай.</p>
          <a href="mailto:info@testhub.mn" className="btn-brutal green-btn btn-inline" style={{ display: 'inline-block', marginTop: '10px' }}>
            📧 info@testhub.mn
          </a>
        </div>
      </div>
    </main>
  )
}

export default Help

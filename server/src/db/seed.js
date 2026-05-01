import { queryOne, runSql } from './database.js'

const exams = [
  { icon: '📐', icon_color: 'icon-blue',  name: '2024 оны Математикийн загвар тест',           price: '₮18,900', subject: 'Математик',  year: '2024', questions: 50, duration: '90 мин', difficulty: 'Дунд'   },
  { icon: '📖', icon_color: 'icon-gold',  name: '2024 оны Монгол хэлний загвар тест',          price: '₮15,000', subject: 'Монгол хэл', year: '2024', questions: 40, duration: '60 мин', difficulty: 'Хялбар' },
  { icon: '🔬', icon_color: 'icon-green', name: '2024 оны Физикийн загвар тест',               price: '₮15,000', subject: 'Физик',      year: '2024', questions: 45, duration: '75 мин', difficulty: 'Хэцүү'  },
  { icon: '📐', icon_color: 'icon-blue',  name: '2023 оны Математикийн загвар тест',           price: '₮14,900', subject: 'Математик',  year: '2023', questions: 50, duration: '90 мин', difficulty: 'Дунд'   },
  { icon: '🧪', icon_color: 'icon-gold',  name: '2023 оны Химийн загвар тест',                 price: '₮12,000', subject: 'Хими',       year: '2023', questions: 40, duration: '60 мин', difficulty: 'Дунд'   },
  { icon: '🌿', icon_color: 'icon-green', name: '2023 оны Биологийн загвар тест',              price: '₮12,000', subject: 'Биологи',    year: '2023', questions: 45, duration: '75 мин', difficulty: 'Хялбар' },
  { icon: '🔤', icon_color: 'icon-blue',  name: '2024 оны Англи хэлний загвар тест',           price: '₮15,000', subject: 'Англи хэл', year: '2024', questions: 60, duration: '90 мин', difficulty: 'Дунд'   },
  { icon: '📜', icon_color: 'icon-gold',  name: '2023 оны Түүхийн загвар тест',                price: '₮10,000', subject: 'Түүх',       year: '2023', questions: 35, duration: '60 мин', difficulty: 'Хялбар' },
  { icon: '🔭', icon_color: 'icon-green', name: '2022 оны Физикийн загвар тест',               price: '₮12,000', subject: 'Физик',      year: '2022', questions: 45, duration: '75 мин', difficulty: 'Хэцүү'  },
  { icon: '🔤', icon_color: 'icon-gold',  name: '2025 оны Англи хэлний шалгалт — Хувилбар А', price: 'Үнэгүй',  subject: 'Англи хэл', year: '2025', questions: 47, duration: '90 мин', difficulty: 'Дунд'   },
]

const competitions = [
  { icon: '🏆', icon_class: 'icon-gold',  title: 'Улсын Математикийн Олимпиад', date: '2024-05-20', status: 'upcoming', participants: 1200, prize: '₮5,000,000', subject: 'Математик',    price: 15000, likes: 345 },
  { icon: '💻', icon_class: 'icon-blue',  title: 'Мэдээлэл Зүйн Уралдаан',     date: '2023-12-15', status: 'past',     participants:  850, prize: '₮3,000,000', subject: 'Мэдээлэл зүй', price:     0, likes: 210 },
  { icon: '🔬', icon_class: 'icon-green', title: 'Физикийн Сорилго',            date: '2024-06-10', status: 'upcoming', participants:  500, prize: '₮2,000,000', subject: 'Физик',        price: 10000, likes:  89 },
  { icon: '🏆', icon_class: 'icon-gold',  title: 'Математикийн сорил 2',        date: '2024-05-21', status: 'upcoming', participants: 1200, prize: '₮5,000,000', subject: 'Математик',    price: 15000, likes:  35 },
  { icon: '💻', icon_class: 'icon-blue',  title: 'Физик уралдаант сорил',       date: '2023-12-15', status: 'past',     participants:  850, prize: '₮3,000,000', subject: 'Физик',        price:     0, likes:  21 },
  { icon: '🔬', icon_class: 'icon-green', title: 'Монгол хэлний сорил',         date: '2024-06-11', status: 'upcoming', participants:  500, prize: '₮2,000,000', subject: 'Монгол хэл',   price: 10000, likes:   8 },
]

const { count: examCount } = queryOne('SELECT COUNT(*) AS count FROM exams')
if (examCount === 0) {
  for (const e of exams) {
    runSql(
      'INSERT INTO exams (icon, icon_color, name, price, subject, year, questions, duration, difficulty) VALUES (?,?,?,?,?,?,?,?,?)',
      [e.icon, e.icon_color, e.name, e.price, e.subject, e.year, e.questions, e.duration, e.difficulty],
    )
  }
  console.log(`Seeded ${exams.length} exams.`)
}

const { count: compCount } = queryOne('SELECT COUNT(*) AS count FROM competitions')
if (compCount === 0) {
  for (const c of competitions) {
    runSql(
      'INSERT INTO competitions (icon, icon_class, title, date, status, participants, prize, subject, price, likes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [c.icon, c.icon_class, c.title, c.date, c.status, c.participants, c.prize, c.subject, c.price, c.likes],
    )
  }
  console.log(`Seeded ${competitions.length} competitions.`)
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS ruxsat berilmagan'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// generalLimiter YO'Q — faqat auth routelarda ishlatiladi

connectDB();

const { startCleanupJob } = require('./jobs/cleanupSessions');
startCleanupJob();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vocabulary', require('./routes/vocabulary'));
app.use('/api/speaking', require('./routes/speaking'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/mock-exam', require('./routes/mockExam'));
app.use('/api/payment', require('./routes/payment'));

app.get('/', (req, res) => {
  res.json({ message: 'IELTS Speaking AI API ishlayapti!' });
});

app.use((err, req, res, next) => {
  console.error('Server xatosi:', err.message);
  res.status(500).json({ message: 'Server xatosi yuz berdi' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});

app.use('/api', require('./routes'));
const cors = require('cors');
app.use(cors({
  origin: "https://speakingai.me"
}));
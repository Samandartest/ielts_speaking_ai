const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vocabulary', require('./routes/vocabulary'));
app.use('/api/speaking', require('./routes/speaking'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));  // YANGI

app.get('/', (req, res) => {
  res.json({ message: 'IELTS Speaking AI API ishlayapti!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});
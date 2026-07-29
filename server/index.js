require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const upload = require('./middleware/Upload'); 

const app = express();
connectDB();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://rentease-frontend.vercel.app',
  'https://rentease-frontend-dusky.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/rentease-frontend.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/admin', require('./routes/Admin'));       
app.use('/api/categories', require('./routes/categories'));
app.use('/api/vendor', require('./routes/vendor'));

app.post('/api/upload', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const urls = req.files.map(file => file.path);
    
    res.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Image upload failed: ' + error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'RentEase Backend' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message && (err.message.includes('images') || err.message.includes('file'))) {
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
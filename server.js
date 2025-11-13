require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 404 - must be after routes
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

// Error handler (basic)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} • NODE_ENV=${process.env.NODE_ENV || 'development'}`);
});
// server.js (near other routes)
const openaiRouter = require('./routes/openai');
app.use('/api', openaiRouter);

const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Book Management API Çalışıyor' });
});

app.use(errorMiddleware);

module.exports = app;
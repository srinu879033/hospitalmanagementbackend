const app = require('./app');
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('Listening to port 3001');
});

module.exports = app;

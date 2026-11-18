let app = null;
let initError = null;

try {
  app = require('../src/app');
} catch (err) {
  initError = err;
  console.error('Vercel Express Init Error:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      success: false,
      error: initError.message || 'Server initialization error'
    });
  }
  return app(req, res);
};

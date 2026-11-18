function errorHandler(err, req, res, next) {
  console.error('🔥 Server Error:', err);

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Conflict error: A duplicate record already exists.',
      detail: err.detail
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key violation: Related record not found.',
      detail: err.detail
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error. Please try again later.'
  });
}

module.exports = errorHandler;

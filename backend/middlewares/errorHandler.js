export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message?.includes('Only .xlsx')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

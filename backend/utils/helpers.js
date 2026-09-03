export const ApiSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const ApiError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const getRandomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatPhoneForWhatsApp = (phone) => {
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    cleaned = cleaned + '@s.whatsapp.net';
  }
  return cleaned;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

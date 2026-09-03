export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  messageDelayMin: parseInt(process.env.MESSAGE_DELAY_MIN) || 4000,
  messageDelayMax: parseInt(process.env.MESSAGE_DELAY_MAX) || 6000,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  sessionsPath: './sessions',
};

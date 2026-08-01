export const getHealthStatus = async () => {
  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Sinar Anugrah API',
  };
};

export const environment = {
  production: true,
  API_CONFIG: {
    BASE_URL: `http://localhost:${window.location.port}`,
    BROKER_URL: `ws://localhost:${window.location.port}/ws`,
  },
};

const isDevelopment = import.meta.env.DEV;

export const config = {
  apiUrl: isDevelopment 
    ? '/api' // This will be proxied to http://localhost:8000 in development
    : 'http://localhost:8000' // Users will need to run the backend locally
};

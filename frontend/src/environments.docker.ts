// src/environments.docker.ts
export const environment = {
    production: false,
    apiUrl: 'http://backend:8000/api' // Use service name inside Docker network
};
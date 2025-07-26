// src/environments.docker.ts
export const environment = {
    production: false,
    // Use relative API URL so dev server proxy works both locally and in Docker
    apiUrl: '/api'
};
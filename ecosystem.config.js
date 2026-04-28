module.exports = {
  apps: [
    {
      name: 'web-app-assignment',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};

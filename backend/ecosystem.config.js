module.exports = {
  apps: [{
    name: 'prootech-platform',
    script: 'src/index.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5100,
    },
    error_file: './logs/err.log',
    out_file:   './logs/out.log',
    time: true,
  }],
};

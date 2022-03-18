module.exports = {
  apps: [{
    name: "acfun",
    script: "./entry.js",
    watch: [
      'app.js',
      'config.js',
      'pages.js',
      'util.js'
    ],
    watch_delay: 1000,
    max_memory_restart: "800M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/acfun-err.log",
    out_file: "./logs/acfun-out.log",
    restart_delay: 1000,
    cron_restart: '01 00 * * *',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
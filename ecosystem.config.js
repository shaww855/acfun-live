module.exports = {
  apps: [{
    name: "acfun",
    script: "./app.js",
    watch: true,
    watch_delay: 1000,
    ignore_watch: [
      "node_modules",
      "logs"
    ],
    max_memory_restart: "800M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/acfun-err.log",
    out_file: "./logs/acfun-out.log",
    Combine_logs: true,
    exp_backoff_restart_delay: 1000,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
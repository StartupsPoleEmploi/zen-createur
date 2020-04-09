const config = {
  apps: [
    {
      name: 'api',
      script: 'bin/www',
      watch:
        process.env.NODE_ENV === 'development'
        || process.env.NODE_ENV === 'test',
      ignore_watch: ['uploads', 'datalake', 'var'],
    },
    {
      name: 'api-admin',
      script: 'bin/www',
      args: '--admin',
      watch: process.env.NODE_ENV === 'development',
      ignore_watch: ['uploads', 'datalake', 'var'],
    },
  ],
};

module.exports = config;

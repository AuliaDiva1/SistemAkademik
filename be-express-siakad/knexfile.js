import { config } from "dotenv";

config();

const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  }
};

const knexConfig = {
  development: {
    client: "mysql2",
    connection: connectionConfig,
    migrations: {
      directory: "./src/migrations",
      extension: "js",
    },
  },

  production: {
    client: "mysql2",
    connection: connectionConfig,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: "./src/migrations",
      extension: "js",
    },
  },
};

export default knexConfig;

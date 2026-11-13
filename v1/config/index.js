import * as dotenv from "dotenv";
dotenv.config();

const {
  NODE_ENV,
  FRONTEND_DEV_URL,
  FRONTEND_PROD_URL,
  Railway_DB_HOST,
  Railway_DB_PORT,
  Railway_DB_USER,
  Railway_DB_PASSWORD,
  Railway_DB_NAME,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  SECRET_ACCESS_TOKEN,
  SECRET_REFRESH_TOKEN,
  RESEND_API_KEY,
} = process.env;

export {
  NODE_ENV,
  FRONTEND_DEV_URL,
  FRONTEND_PROD_URL,
  Railway_DB_HOST,
  Railway_DB_PORT,
  Railway_DB_USER,
  Railway_DB_PASSWORD,
  Railway_DB_NAME,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  SECRET_ACCESS_TOKEN,
  SECRET_REFRESH_TOKEN,
  RESEND_API_KEY,
};

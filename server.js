import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config({ path: './config.env' });

if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
  throw new Error(
    'Missing DATABASE or DATABASE_PASSWORD in config.env. Check that both keys are defined.'
  );
}

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});

export default server;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import userRouter from './src/routes/userRouter.js';
import AppError from './src/utils/appError.js';
import globalErrorHandler from './src/controllers/errorController.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

app.use('/api/v1/users', userRouter);

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Invalid URL ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

export default app;

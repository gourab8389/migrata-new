import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import rfs from 'rotating-file-stream';
import CryptoJS from 'crypto-js';

const isDevelopment = process.env.NODE_ENV === 'development';

declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}

export const configureMiddleware = (app: Express): void => {
  app.use(cors({
    origin: function (origin, callback) {
      const isLocalhost = isDevelopment && origin && (
        origin.includes('localhost') || 
        origin.includes('127.0.0.1')
      );
      
      if (!origin || (origin && origin.endsWith('.lightning.force.com')) || isLocalhost) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: false,
  }));

  app.enable('trust proxy');
  app.disable('x-powered-by');

  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(helmet.noSniff());

  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "https://*.herokuapp.com"],
      styleSrc: ["'self'", "https://*.herokuapp.com"],
      scriptSrc: ["'self'", "https://*.herokuapp.com"],
      fontSrc: ["'self'", "https://*.herokuapp.com"],
      upgradeInsecureRequests: [],
      frameAncestors: ["'none'"],
    } as any,
  }));

  app.use(cookieSession({
    name: 'session',
    secret: process.env.SESSION_SECRET || 'SECRET_SECURE_MIGRATA',
    maxAge: isDevelopment ? 1000 * 60 * 10 : 1000 * 60,
    sameSite: 'lax',
    secure: !isDevelopment,
    httpOnly: true,
  } as any));

  app.use(cookieParser());

  const logsDir = path.join(process.cwd(), 'logs');
  const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: logsDir,
  });

  app.use(morgan('combined', { stream: accessLogStream }));
  app.use(morgan('dev'));
};

export const csrfTokenRoute = (req: Request, res: Response): void => {
  if (!isDevelopment && req.session?.csrf) {
    res.json({ token: req.session.csrf });
    return;
  }

  const dataString = 'mig rata';
  const encData = CryptoJS.AES.encrypt(dataString, 'secret key 123').toString();
  
  if (req.session) {
    req.session.csrf = encData;
  }

  res.json({ token: encData });
};
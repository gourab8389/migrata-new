import { Request, Response, NextFunction } from 'express';
import CryptoJS from 'crypto-js';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Exclude CSRF token verification for the callback endpoint
  if (req.path === '/callback') {
    return next();
  }

  const csrfParam = (req.query && (req.query as any).csrf) || null;
  if (!csrfParam) {
    return res.status(400).send('CSRF Token not included.');
  }

  // Replace encoded + signs
  const token = String(csrfParam).replace(/%2B/g, '+');

  let decryptedData: string;
  try {
    decryptedData = CryptoJS.AES.decrypt(token, 'secret key 123').toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return res.status(400).send('Failed to decrypt CSRF token.');
  }

  if (!decryptedData) {
    return res.status(400).send('Malformed CSRF Token data.');
  }

  const dataString = 'mig rata';
  if (decryptedData !== dataString) {
    return res.status(400).send('CSRF Token does not match.');
  }

  next();
};

export default csrfProtection;

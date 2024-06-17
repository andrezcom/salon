import { Request, Response, NextFunction } from 'express';

const jwt = require('jsonwebtoken');

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('midd');

  if (!req.headers['authorization']) {
    return res.json({ error: 'no hay token' })
  }
  const token = req.headers['authorization']

  try {
    console.log('este es auth: ' + req.headers['authorization']);
    const payload = jwt.verify(token, 'token establecido');
    console.log('ups', payload);
    next();
    return true;
  }
  catch (err) {
    return res.json({ error: 'token incorrecto' });
  }
}
export default checkToken
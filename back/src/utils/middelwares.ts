import { Request, Response, NextFunction } from 'express';

const jwt = require('jsonwebtoken');

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['authorization']) {
    return res.json({ error: 'no hay token' })
  }
  const token = req.headers['authorization']

  try {
    console.log('este es auth: ' + req.headers['authorization']);
    const payload = jwt.verify(token, 'token establecido');
    console.log(payload);
    next();
    return true;
  }
  catch (err) {
    return res.json({ error: 'token incorrecto' });
  }
}
module.exports = { checkToken };
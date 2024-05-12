import { Request, Response } from 'express';
import { getUsersSrv, postUserSrv, putUserSrv, loginUserSrv } from '../services/userServ';

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');
export async function getUsersCtrl(_req: Request, res: Response) {
  try {
    const users = await getUsersSrv();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const userById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postUserCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };
  try {
    const user = req.body;
    user.pass = bcrypt.hashSync(req.body.pass)
    const newUser = await postUserSrv(user)
    res.status(200).json(newUser);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};


export async function loginUserCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is error in user and password')
  };
  try {
    const login = await loginUserSrv(req.body)
    res.status(200).json({
      login: login.success,
      user: login.user,
      token: createToken(login.user)
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putUserCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const user = req.body;
    const putUser = await putUserSrv(user)
    res.status(200).json({ data: putUser });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

function createToken(user: any) {
  const payload = {
    id: user._id,
    role: user.role
  }
  return jwt.sign(payload, 'token establecido')
}
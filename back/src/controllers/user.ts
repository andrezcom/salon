import { Request, Response } from 'express';
import { getUsersSrv, postUserSrv } from '../services/user/userServ';
import User from '../models/users';

export async function getUsersCtrl(_req: Request, res: Response) {
  try {
    const users = await getUsersSrv();
    res.status(200).json({ data: users });
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
    throw console.error('no hay')
  };

  try {
    const User = req.body;
    const newUser = await postUserSrv(User)

    res.status(200).json({ data: newUser });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putUserCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('no hay')
  };

  try {
    const user = req.body;
    const newUser = new User(user);
    await User.findByIdAndUpdate(newUser._id, newUser);
    res.json(newUser)
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

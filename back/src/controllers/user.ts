import { Request, Response } from 'express';
import { getUsersSrv, postUserSrv, putUserSrv } from '../services/userServ';


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
    throw console.error('There is no request')
  };

  try {
    const user = req.body;
    const newUser = await postUserSrv(user)
    res.status(200).json({ data: newUser });
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

import { Request, Response } from 'express';
import { getClientsSrv, postClientSrv, putClientSrv } from '../services/clientServ';


export async function getClientsCtrl(_req: Request, res: Response) {
  try {
    const experts = await getClientsSrv();
    res.status(200).json({ data: experts });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const clientById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postClientCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const client = req.body;
    const newClient = await postClientSrv(client)
    res.status(200).json({ data: newClient });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putClientCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const client = req.body;
    const putClient = await putClientSrv(client)
    res.status(200).json({ data: putClient });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

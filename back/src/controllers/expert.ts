import { Request, Response } from 'express';
import { getExpertsSrv, postExpertSrv, putExpertSrv } from '../services/expertServ';


export async function getExpertsCtrl(_req: Request, res: Response) {
  try {
    const experts = await getExpertsSrv();
    res.status(200).json({ data: experts });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const expertById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postExpertCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const expert = req.body;
    const newExpert = await postExpertSrv(expert)
    res.status(200).json({ data: newExpert });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putExpertCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const expert = req.body;
    const putExpert = await putExpertSrv(expert)
    res.status(200).json({ data: putExpert });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

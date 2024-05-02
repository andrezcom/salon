import { Request, Response } from 'express';
import { getProvidersSrv, postProviderSrv, putProviderSrv } from '../services/providerServ';


export async function getProvidersCtrl(_req: Request, res: Response) {
  try {
    const experts = await getProvidersSrv();
    res.status(200).json({ data: experts });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const providerById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postProviderCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const provider = req.body;
    const newProvider = await postProviderSrv(provider)
    res.status(200).json({ data: newProvider });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putProviderCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const provider = req.body;
    const putProvider = await putProviderSrv(provider)
    res.status(200).json({ data: putProvider });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

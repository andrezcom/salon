import { Request, Response } from 'express';
import { getServicesSrv, postServiceSrv, putServiceSrv } from '../services/serviceServ';


export async function getServicesCtrl(_req: Request, res: Response) {
  try {
    const services = await getServicesSrv();
    res.status(200).json({ data: services });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const serviceById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postServiceCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const service = req.body;
    const newService = await postServiceSrv(service)
    res.status(200).json({ data: newService });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putServiceCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const service = req.body;
    const putService = await putServiceSrv(service)
    res.status(200).json({ data: putService });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

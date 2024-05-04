import { Request, Response } from 'express';
import { getSalesSrv, postSaleSrv, putSaleSrv } from '../services/saleServ';


export async function getSalesCtrl(_req: Request, res: Response) {
  try {
    const experts = await getSalesSrv();
    res.status(200).json({ data: experts });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const saleById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postSaleCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const sale = req.body;
    const newSale = await postSaleSrv(sale)
    res.status(200).json({ data: newSale });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putSaleCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const sale = req.body;
    const putSale = await putSaleSrv(sale)
    res.status(200).json({ data: putSale });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

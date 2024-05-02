import { Request, Response } from 'express';
import { getPaymentsSrv, postPaymentSrv, putPaymentSrv } from '../services/paymentServ';


export async function getPaymentsCtrl(_req: Request, res: Response) {
  try {
    const payments = await getPaymentsSrv();
    res.status(200).json({ data: payments });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const paymentById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postPaymentCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const payment = req.body;
    const newPayment = await postPaymentSrv(payment)
    res.status(200).json({ data: newPayment });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putPaymentCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const payment = req.body;
    const putPayment = await putPaymentSrv(payment)
    res.status(200).json({ data: putPayment });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

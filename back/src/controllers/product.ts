import { Request, Response } from 'express';
import { getProductsSrv, postProductSrv, putProductSrv } from '../services/productServ';


export async function getProductsCtrl(_req: Request, res: Response) {
  try {
    const products = await getProductsSrv();
    res.status(200).json({ data: products });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
}

export const productById = (_req: Request, res: Response) => {
  res.send('login');
};

export async function postProductCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const product = req.body;
    const newProduct = await postProductSrv(product)
    res.status(200).json({ data: newProduct });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

export async function putProductCtrl(req: Request, res: Response) {
  if (!req.body) {
    throw console.error('There is no request')
  };

  try {
    const product = req.body;
    const putProduct = await putProductSrv(product)
    res.status(200).json({ data: putProduct });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error', err: err
    });
  }
};

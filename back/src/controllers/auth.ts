import { Request, Response } from 'express'

export const login = (_req: Request, res: Response) => {
  res.send('Users')
}

export const code = (_req: Request, res: Response) => {
  res.send('UserById')
}
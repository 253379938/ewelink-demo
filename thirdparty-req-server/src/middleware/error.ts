import type { NextFunction, Request, Response } from 'express'

// 404
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ code: 404, message: 'Not Found' })
}

// code 500 处理
export function errorHandler(err: unknown, _req: Request, res: Response) {
  console.error('[error]', err)
   res.status(500).json({ code: 500, message: 'Server Error' })
}

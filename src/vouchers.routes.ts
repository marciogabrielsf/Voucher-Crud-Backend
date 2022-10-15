import { Router, Request, Response, RequestHandler } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from './middlewares/verifyjwt'

const prisma = new PrismaClient()
const voucherRoutes = Router()
const secret = process.env.SECRET

voucherRoutes.get('/voucher/create', (async (req: Request, res: Response) => {
  const { value, voucherNumber, orderNumber, company, voucherDate, id } = req.body
  if (!value || !voucherDate || voucherNumber || orderNumber || company || id) {
    res.status(422).json({ message: 'Missing parameters' })
  }
}) as RequestHandler)

export default voucherRoutes

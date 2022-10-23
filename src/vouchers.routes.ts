/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router, Request, Response, RequestHandler } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from './middlewares/verifyjwt'

const prisma = new PrismaClient()
const voucherRoutes = Router()

voucherRoutes.post('/voucher/create', verifyJWT, (async (req: Request, res: Response) => {
  const { value, voucherNumber, orderNumber, company, voucherDate, id } = req.body
  if (!value || !voucherDate || !voucherNumber || !orderNumber || !company) {
    return res.status(422).json({ message: 'Missing parameters' })
  }

  const voucherExist = await prisma.voucher.findMany({
    where: {
      voucherNumber,
      userId: id
    }
  })

  if (voucherExist.length !== 0) {
    return res.status(422).json({ message: 'O Número do voucher já está cadastrado' })
  }

  const orderExist = await prisma.voucher.findMany({
    where: {
      orderNumber,
      userId: id
    }
  })

  if (orderExist.length !== 0) {
    return res.status(422).json({ message: 'O Número do pedido já está cadastrado' })
  }

  await prisma.voucher.create({
    data: {
      userId: id,
      value,
      voucherDate,
      voucherNumber,
      company,
      orderNumber
    },
    include: {
      user: true
    }
  }).then(() => {
    res.status(201).json({
      code: 'voucher.created-success',
      message: 'Voucher Criado com sucesso!'
    })
  })
}) as RequestHandler)

export default voucherRoutes

voucherRoutes.get('/voucher/getlist', verifyJWT, (async (req: Request, res: Response) => {
  const id = req.body.id

  const vouchers = await prisma.voucher.findMany({
    where: {
      userId: id
    }
  })
  if (vouchers.length === 0) {
    res.status(422).json({ message: 'Nenhum voucher foi encontrado' })
  } else { res.status(200).json({ vouchers }) }
}) as RequestHandler)

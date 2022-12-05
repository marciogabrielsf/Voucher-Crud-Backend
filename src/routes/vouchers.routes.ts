/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router, Request, Response, RequestHandler } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '../middlewares/verifyjwt'
import { userInfo } from 'os'

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
  }).catch(err => {
    res.status(500).json({ message: 'Erro ao Atualizar o Voucher, tente novamente mais tarde' })
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


voucherRoutes.put('/voucher/update/:id', verifyJWT, (async (req: Request, res: Response) => {
  const id = req.body.id
  const voucherID = req.params.id
  const { value, company, orderNumber, voucherDate, voucherNumber } = req.body

  if (!value || !company || !orderNumber || !voucherDate || !voucherNumber) {

    return res.status(422).json({ message: 'Missing parameters' })
  }


  var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$")
  if (!checkForHexRegExp.test(voucherID)) {
    return res.status(422).json({ message: 'Invalid ID' })
  }

  const getVoucher = await prisma.voucher.findUnique({
    where: {
      id: voucherID
    }
  })

  if (getVoucher.userId !== id) {
    return res.status(422).json({ message: 'Invalid Token to update this voucher.' })
  }

  if (!getVoucher) {
    return res.status(404).json({ message: 'Voucher não encontrado' })
  }

  await prisma.voucher.update({
    where: {
      id: getVoucher.id
    },
    data: {
      company,
      value,
      orderNumber,
      voucherDate,
      voucherNumber
    }
  }).then(() => {
    res.status(200).json({ message: 'Voucher foi atualizado com sucesso!' })
  }).catch(err => {
    res.status(500).json({ message: 'Erro ao Atualizar o Voucher, tente novamente mais tarde' })
  })

}) as RequestHandler)


voucherRoutes.delete('/voucher/delete/:id', verifyJWT, (async (req: Request, res: Response) => {
  const id = req.body.id
  const voucherID = req.params.id

  var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$")
  if (!checkForHexRegExp.test(voucherID)) {
    return res.status(422).json({ message: 'Invalid ID' })
  }

  const getVoucher = await prisma.voucher.findUnique({
    where: {
      id: voucherID
    }
  })

  if (!getVoucher) {
    return res.status(404).json({ message: 'Voucher não encontrado' })
  }

  if (getVoucher.userId !== id) {
    return res.status(422).json({ message: 'Invalid Token to update this voucher.' })
  }

  await prisma.voucher.delete({
    where: {
      id: getVoucher.id
    }
  }).then(() => {
    res.status(200).json({ message: 'O Voucher foi Deletado com sucesso!' })
  }).catch(err => {
    res.status(500).json({ message: 'Erro ao deletar o Voucher' })
  })

}) as RequestHandler)
import { Router, Request, Response, RequestHandler } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from './middlewares/verifyjwt'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const useRouter = Router()
const secret = process.env.SECRET

// get user
useRouter.get('/auth/verify', verifyJWT, (async (req: Request, res: Response) => {
  const { id } = req.body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return res.status(404).json({
      code: 'user.user-not-found',
      status: 'Usuário não encontrado'
    })
  }
  const firstName = user.name.split(' ')[0]
  delete user.password
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      firstName
    }
  })
}) as RequestHandler)

// Register User
useRouter.post('/auth/register', (async (req: Request, res: Response) => {
  const { name, email, cpf, password, confirmpassword } = req.body

  // validation

  if (!name || !email || !cpf || !password || !confirmpassword) {
    return res.status(422).json({
      code: 'user.missing-parameters',
      message: 'Preencha todos os campos!'
    })
  }

  if (password !== confirmpassword) {
    return res.status(422).json({
      code: 'user.password-mismatch',
      message: 'As senhas não estão iguais'
    })
  }
  // verify userExist
  const userExist = await prisma.user.findUnique({
    where: { email }
  })

  if (userExist) {
    return res.status(422).json({
      code: 'user.email-exists',
      message: 'Este Email Já está cadastrado'
    })
  }
  // verify cpfExist
  const cpfExist = await prisma.user.findUnique({
    where: { cpf }
  })

  if (cpfExist) {
    return res.status(422).json({
      code: 'user.cpf-exists',
      message: 'O Cpf já está Cadastrado'
    })
  }

  // hash password
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  // create user
  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      cpf
    }
  }).then(() => {
    res.status(201).json({
      code: 'user.created-successfully',
      message: 'Usuário Criado com sucesso!'
    })
  }).catch(() => {
    res.status(500).json({
      code: 'user.server-error',
      message: 'Sem comunicação com o servidor, tente novamente mais tarde.'
    })
  })
}) as RequestHandler)

// Login user
useRouter.post('/auth/login', (async (req: Request, res: Response) => {
  const { email, password } = req.body

  // validate
  if (!email || !password) {
    return res.status(422).json({
      code: 'user.missing-parameters',
      message: 'Preencha todos os campos!'
    })
  }
  // check user
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })
  // check user not found
  if (!user) {
    return res.status(404).json({
      code: 'user.user-not-found',
      message: 'Usuário Não encontrado.'
    })
  }

  // check if password match
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(422).json({
      code: 'user.password-mismatch',
      message: 'Senha inválida.'
    })
  }

  try {
    const token = jwt.sign(
      {
        id: user.id
      },
      secret,
      { expiresIn: 300 }
    )
    delete user.password
    const firstName = user.name.split(' ')[0]
    res.status(200).json({
      code: 'user.login-success',
      message: 'Autenticação Realizada com Sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        cpf: user.cpf,
        firstName
      },
      token
    })
  } catch (err) {
    res.status(500).json({
      code: 'user.server-error',
      message: 'Sem comunicação com o servidor, tente novamente mais tarde.'
    })
  }
}) as RequestHandler)

export default useRouter

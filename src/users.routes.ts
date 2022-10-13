import { Router, Request, Response, RequestHandler } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const useRouter = Router()

useRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json('Olá Mundo!')
})

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
    return res.status(422).json({
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
}) as RequestHandler)

export default useRouter

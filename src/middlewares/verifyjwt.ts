import { NextFunction, Response, Request } from 'express'
import jwt from 'jsonwebtoken'
const secret = process.env.SECRET

interface JwtPayload {
  id: string
}

export function verifyJWT (req: Request, res: Response, next: NextFunction): void {
  const { authorization } = req.headers

  const token = authorization.split(' ')[1]

  if (!token) {
    res.status(401).json({ message: 'Acesso Negado!' })
  }

  jwt.verify(token, secret, (error, decoded: JwtPayload) => {
    if (error) return res.status(400).json({ message: 'Invalid Token' })
    req.body.id = decoded.id
    next()
  })
}

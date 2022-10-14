import { NextFunction, Response, Request } from 'express'
import jwt from 'jsonwebtoken'
const secret = process.env.SECRET

interface JwtPayload {
  id: string
}

export function verifyJWT (req: Request, res: Response, next: NextFunction): void {
  const { authorization } = req.headers
  if (!authorization) {
    res.status(401).json({ message: 'Acesso Negado!' })
  }

  jwt.verify(authorization, secret, (error, decoded: JwtPayload) => {
    if (error) return res.status(400).json({ message: 'Invalid Token' })
    req.body.id = decoded.id
    console.log(req.body.id)
    next()
  })
}

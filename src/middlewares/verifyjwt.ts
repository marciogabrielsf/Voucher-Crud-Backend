import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
const secret = process.env.SECRET || "default_secret_for_dev";

interface JwtPayload {
    id: string;
}

// Add user ID property to Express Response locals
declare global {
    namespace Express {
        interface Locals {
            userId?: string;
        }
    }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
    const { authorization } = req.headers;

    if (authorization) {
        const token = authorization.split(" ")[1];

        jwt.verify(token, secret, (error, decoded) => {
            if (error) return res.status(400).json({ message: "Invalid Token" });

            // Check if decoded is not null before accessing its properties
            if (decoded && typeof decoded === "object" && "id" in decoded) {
                // Store user ID in res.locals instead of modifying req.body
                res.locals.userId = (decoded as JwtPayload).id;

                // Also add to body for backward compatibility
                try {
                    if (req.body === undefined) {
                        req.body = {};
                    }
                    req.body.id = (decoded as JwtPayload).id;
                } catch (err) {
                    console.error("Failed to set req.body.id:", err);
                    // We can continue since we have res.locals.userId as backup
                }

                next();
            } else {
                return res.status(400).json({ message: "Invalid Token Structure" });
            }
        });
    } else {
        res.status(401).json({ message: "Acesso Negado!" });
    }
}

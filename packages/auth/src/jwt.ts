import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
    userId: string;
}

export function signJwt(payload: JwtPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

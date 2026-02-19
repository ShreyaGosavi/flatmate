import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined in environment variables");

const SECRET: string = JWT_SECRET;

export interface JwtPayload {
    userId: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

export function verifyJwt(token: string): JwtPayload {
    const decoded = jwt.verify(token, SECRET);

    if (typeof decoded === "string" || !("userId" in decoded)) {
        throw new Error("Invalid token payload");
    }

    return decoded as JwtPayload;
}
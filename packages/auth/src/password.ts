import * as argon2 from "argon2";

export const hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, {
        type: argon2.argon2id,
    });
};

export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return argon2.verify(hash, password); // hash first, password second
};
export const hashPassword = jest.fn().mockResolvedValue("hashed_password");
export const verifyPassword = jest.fn().mockResolvedValue(true);
export const signJwt = jest.fn().mockReturnValue("mock_jwt_token");
export const setAuthCookie = jest.fn();
export const requireAuth = jest.fn();
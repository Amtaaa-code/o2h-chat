import jwt from 'jsonwebtoken';

export const generateTokens = (userId: number) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
  });
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): { userId: number } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: number };
};

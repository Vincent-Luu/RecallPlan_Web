import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload as { admin?: boolean; role?: string; id?: number; username?: string } | null;
}

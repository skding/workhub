import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "workhub_pnc_secret_key_engineering_daily_ops_2026"
);

export const COOKIE_NAME = "workhub_session";

export interface UserSession {
  userId: string;
  username: string;
  name: string;
  role: string;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate signed JWT session token (valid for 30 days)
export async function createAuthToken(user: UserSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

// Verify JWT session token
export async function verifyAuthToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch (err) {
    return null;
  }
}

// Get current user session from request cookies in Server Components or API Routes
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAuthToken(token);
  } catch (err) {
    return null;
  }
}

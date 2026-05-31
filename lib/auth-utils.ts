import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development_only';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
    username: string;
    role: string;
    [key: string]: any;
}

export async function signToken(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d') // 1 day session
        .sign(encodedSecret);
}

export async function verifyToken(token: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(token, encodedSecret);
        return payload as SessionPayload;
    } catch (error) {
        return null;
    }
}

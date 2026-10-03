import crypto from 'crypto';

export function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return verifyHash === hash;
}

export function generateToken(payload: object) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url'); // 7 days
    const secret = process.env.JWT_SECRET || 'saoudi_super_secret_fallback_key';
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string) {
    try {
        const [header, body, signature] = token.split('.');
        const secret = process.env.JWT_SECRET || 'saoudi_super_secret_fallback_key';
        const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
        
        if (signature !== expectedSignature) return null;
        
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (payload.exp < Date.now()) return null; // Expired
        
        return payload;
    } catch (e) {
        return null;
    }
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 生成JWT令牌
export function generateToken(userId: string, role: string): string {
    return jwt.sign(
        {
            userId,
            role,
        },
        JWT_SECRET,
        {
            expiresIn: '1d', // 令牌有效期1天
        }
    );
}

// 验证JWT令牌
export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 解析JWT令牌(不验证有效性)
export function decodeToken(token: string): any {
    return jwt.decode(token);
} 
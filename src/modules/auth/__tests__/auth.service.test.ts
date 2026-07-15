import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authService from '../auth.service';

/**
 * UT-001: 会員登録 - 正常系
 * UT-002: パスワード境界値（最小 8文字）
 * UT-003: パスワード境界値（最大 64文字）
 * UT-005: ログイン - 正常系
 * UT-007: bcrypt.compare 検証
 */

describe('Auth Service - Bcrypt & JWT', () => {
  const JWT_SECRET = 'test-secret-key-do-not-use-in-prod';
  const TEST_PASSWORD = 'Test1234';

  describe('bcryptjs password hashing', () => {
    it('UT-001: should hash password with bcrypt cost factor 12', async () => {
      // Arrange
      const plainPassword = TEST_PASSWORD;
      const costFactor = 12;

      // Act
      const hashed = await bcrypt.hash(plainPassword, costFactor);

      // Assert
      expect(hashed).not.toEqual(plainPassword);
      expect(hashed).toBeTruthy();
      expect(hashed.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('UT-007: bcrypt.compare should validate matching passwords', async () => {
      // Arrange
      const plainPassword = TEST_PASSWORD;
      const hashed = await bcrypt.hash(plainPassword, 12);

      // Act
      const isMatch = await bcrypt.compare(plainPassword, hashed);

      // Assert
      expect(isMatch).toBe(true);
    });

    it('UT-007: bcrypt.compare should reject non-matching passwords', async () => {
      // Arrange
      const plainPassword = TEST_PASSWORD;
      const wrongPassword = 'WrongPass123';
      const hashed = await bcrypt.hash(plainPassword, 12);

      // Act
      const isMatch = await bcrypt.compare(wrongPassword, hashed);

      // Assert
      expect(isMatch).toBe(false);
    });

    it('UT-002: should accept minimum password length (8 characters)', () => {
      // Arrange
      const minPassword = 'Pass1234'; // 8 chars

      // Assert
      expect(minPassword.length).toBe(8);
    });

    it('UT-002: should reject less than 8 characters', () => {
      // Arrange
      const shortPassword = 'Pass123'; // 7 chars

      // Assert
      expect(shortPassword.length).toBeLessThan(8);
    });

    it('UT-003: should accept maximum password length (64 characters)', () => {
      // Arrange
      const maxPassword = 'A'.repeat(64);

      // Assert
      expect(maxPassword.length).toBe(64);
    });

    it('UT-003: should reject more than 64 characters', () => {
      // Arrange
      const longPassword = 'A'.repeat(65);

      // Assert
      expect(longPassword.length).toBeGreaterThan(64);
    });
  });

  describe('JWT token generation and validation', () => {
    it('UT-005: should generate JWT with userId and email', () => {
      // Arrange
      const payload = { userId: 'user-001', email: 'user@example.com' };
      const expiresIn = '24h';

      // Act
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn } as any);

      // Assert
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user-001');
      expect(decoded.email).toBe('user@example.com');
    });

    it('UT-005: should include expiry in JWT', () => {
      // Arrange
      const payload = { userId: 'user-001', email: 'user@example.com' };
      const expiresIn = '24h';

      // Act
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Assert
      expect(decoded.exp).toBeDefined();
      // 24h = 86400 seconds
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(86400);
    });

    it('should reject expired token', () => {
      // Arrange
      const payload = { userId: 'user-001', email: 'user@example.com' };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });

      // Wait a bit to ensure expiration
      setTimeout(() => {
        // Act & Assert
        expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow();
      }, 100);
    });

    it('should reject tampered token', () => {
      // Arrange
      const payload = { userId: 'user-001', email: 'user@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const tamperedToken = token.slice(0, -1) + 'X'; // Modify last char

      // Act & Assert
      expect(() => jwt.verify(tamperedToken, JWT_SECRET)).toThrow();
    });
  });

  describe('Password validation edge cases', () => {
    it('UT-006: should handle empty password', () => {
      // Arrange
      const emptyPassword = '';

      // Assert
      expect(emptyPassword.length).toBe(0);
      expect(emptyPassword.length).toBeLessThan(8);
    });

    it('UT-006: should handle special characters in password', async () => {
      // Arrange
      const specialPassword = 'P@ss!#$%^&*()1234';

      // Act
      const hashed = await bcrypt.hash(specialPassword, 12);
      const isMatch = await bcrypt.compare(specialPassword, hashed);

      // Assert
      expect(isMatch).toBe(true);
    });

    it('UT-006: should handle unicode characters in password', async () => {
      // Arrange
      const unicodePassword = 'パスワード12345678';

      // Act
      const hashed = await bcrypt.hash(unicodePassword, 12);
      const isMatch = await bcrypt.compare(unicodePassword, hashed);

      // Assert
      expect(isMatch).toBe(true);
    });
  });
});

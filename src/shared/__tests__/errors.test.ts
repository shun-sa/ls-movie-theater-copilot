import {
  AppError,
  ValidationError,
  AuthenticationError,
  InsufficientStockError,
  InsufficientSeatsError,
  SalesOutOfPeriodError,
  DuplicateEmailError
} from '../errors';

/**
 * UT-021: バリデーションエラー（ERR-001）
 * UT-022: 認証エラー（ERR-002）
 * UT-023: 在庫不足エラー（ERR-003）
 * UT-024: 販売期間外エラー（ERR-004）
 */

describe('Error Classes', () => {
  describe('UT-021: ValidationError (ERR-001)', () => {
    it('should create ValidationError with 400 status code', () => {
      // Arrange & Act
      const error = new ValidationError('メールアドレスが不正です');

      // Assert
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('メールアドレスが不正です');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include fields object for validation errors', () => {
      // Arrange
      const fields = { email: 'Invalid format', password: 'Too short' };

      // Act
      const error = new ValidationError('Validation failed', fields);

      // Assert
      expect(error.statusCode).toBe(400);
      expect(error.fields).toEqual(fields);
    });
  });

  describe('UT-022: AuthenticationError (ERR-002)', () => {
    it('should return 401 status code', () => {
      // Arrange & Act
      const error = new AuthenticationError();

      // Assert
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('メールアドレスまたはパスワードが正しくありません');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should use generic message (NFR-SEC-006)', () => {
      // Arrange
      const expectedGenericMessage = 'メールアドレスまたはパスワードが正しくありません';

      // Act
      const wrongEmailError = new AuthenticationError();
      const wrongPasswordError = new AuthenticationError();

      // Assert
      expect(wrongEmailError.message).toBe(expectedGenericMessage);
      expect(wrongPasswordError.message).toBe(expectedGenericMessage);
      expect(wrongEmailError.message).toBe(wrongPasswordError.message);
    });
  });

  describe('UT-023: InsufficientStockError (ERR-003)', () => {
    it('should return 409 status code for stock error', () => {
      // Arrange & Act
      const error = new InsufficientStockError();

      // Assert
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should include product name in error message', () => {
      // Arrange & Act
      const error = new InsufficientStockError('グッズA');

      // Assert
      expect(error.message).toContain('グッズA');
      expect(error.message).toContain('在庫が不足しています');
    });

    it('should handle no product name', () => {
      // Arrange & Act
      const error = new InsufficientStockError();

      // Assert
      expect(error.message).toBe('在庫が不足しています');
    });
  });

  describe('UT-024: SalesOutOfPeriodError (ERR-004)', () => {
    it('should return 409 status code for sales period error', () => {
      // Arrange & Act
      const error = new SalesOutOfPeriodError();

      // Assert
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('SALES_OUT_OF_PERIOD');
    });

    it('should have appropriate error message', () => {
      // Arrange & Act
      const error = new SalesOutOfPeriodError();

      // Assert
      expect(error.message).toBe('販売期間外のため購入できません');
    });
  });

  describe('InsufficientSeatsError', () => {
    it('should return 409 status code for ticket error', () => {
      // Arrange & Act
      const error = new InsufficientSeatsError();

      // Assert
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('INSUFFICIENT_SEATS');
    });

    it('should have appropriate error message', () => {
      // Arrange & Act
      const error = new InsufficientSeatsError();

      // Assert
      expect(error.message).toBe('残席数が不足しています');
    });
  });

  describe('DuplicateEmailError', () => {
    it('should return 409 status code for duplicate email', () => {
      // Arrange & Act
      const error = new DuplicateEmailError();

      // Assert
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof AppError', () => {
      // Arrange & Act
      const validationError = new ValidationError('Error');
      const authError = new AuthenticationError();

      // Assert
      expect(validationError instanceof AppError).toBe(true);
      expect(authError instanceof AppError).toBe(true);
    });

    it('should be instanceof Error', () => {
      // Arrange & Act
      const error = new ValidationError('Error');

      // Assert
      expect(error instanceof Error).toBe(true);
    });
  });
});

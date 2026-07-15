import {
  isScreeningSaleAvailable,
  isProductSaleAvailable
} from '../types';

/**
 * UT-018: チケット購入 - 販売期間チェック（OQ-002 - sales_end_at 優先）
 * UT-019: チケット購入 - 販売期間チェック（OQ-002 - sales_end_at なし）
 */

describe('Utility Functions - Sales Period Validation', () => {
  describe('UT-018/019: isScreeningSaleAvailable (OQ-002)', () => {
    it('UT-018: should prioritize salesEndAt when present', () => {
      // Arrange: salesEndAt = 過去, startsAt = 未来
      // Mock current time として、自動的に now を内部で取得
      const screening = {
        startsAt: new Date('2100-07-20T18:00:00Z'),      // 未来
        salesStartAt: null,
        salesEndAt: new Date('2020-07-01T12:00:00Z')     // 過去
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(false); // 販売期間外（salesEndAt 過ぎている）
    });

    it('UT-018: should reject when current time exceeds salesEndAt', () => {
      // Arrange
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3600000); // 1時間前
      const screening = {
        startsAt: new Date('2100-07-20T18:00:00Z'),
        salesStartAt: null,
        salesEndAt: pastDate
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(false);
    });

    it('UT-018: should accept when current time is before salesEndAt', () => {
      // Arrange
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // 24時間後
      const screening = {
        startsAt: new Date('2100-07-20T18:00:00Z'),
        salesStartAt: null,
        salesEndAt: futureDate
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(true);
    });

    it('UT-019: should use startsAt when salesEndAt is null', () => {
      // Arrange
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // 24時間後
      const screening = {
        startsAt: futureDate,
        salesStartAt: null,
        salesEndAt: null
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(true); // 現在 < startsAt のため販売可能
    });

    it('UT-019: should reject when current time exceeds startsAt (no salesEndAt)', () => {
      // Arrange
      const pastDate = new Date('2020-07-15T15:00:00Z'); // 過去
      const screening = {
        startsAt: pastDate,
        salesStartAt: null,
        salesEndAt: null
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(false); // 上映開始時刻を過ぎている
    });

    it('should handle salesStartAt rejection', () => {
      // Arrange
      const futureDate = new Date('2100-07-15T15:00:00Z');
      const screening = {
        startsAt: futureDate,
        salesStartAt: futureDate, // salesStart は未来
        salesEndAt: null
      };

      // Act
      const isAvailable = isScreeningSaleAvailable(screening);

      // Assert
      expect(isAvailable).toBe(false); // 販売開始前
    });
  });

  describe('isProductSaleAvailable', () => {
    it('should check product sales period', () => {
      // Arrange
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);
      const futureDate = new Date(now.getTime() + 86400000);

      const product = {
        publishStatus: 'published',
        salesStartAt: pastDate,
        salesEndAt: futureDate,
        stock: 10
      };

      // Act
      const isAvailable = isProductSaleAvailable(product);

      // Assert
      expect(isAvailable).toBe(true);
    });

    it('should reject when product is not published', () => {
      // Arrange
      const product = {
        publishStatus: 'draft',
        salesStartAt: null,
        salesEndAt: null,
        stock: 10
      };

      // Act
      const isAvailable = isProductSaleAvailable(product);

      // Assert
      expect(isAvailable).toBe(false);
    });

    it('should reject when product sales not started', () => {
      // Arrange
      const futureDate = new Date('2100-08-01T00:00:00Z');
      const product = {
        publishStatus: 'published',
        salesStartAt: futureDate,
        salesEndAt: null,
        stock: 10
      };

      // Act
      const isAvailable = isProductSaleAvailable(product);

      // Assert
      expect(isAvailable).toBe(false);
    });

    it('should reject when product sales ended', () => {
      // Arrange
      const pastDate = new Date('2020-07-01T23:59:59Z');
      const product = {
        publishStatus: 'published',
        salesStartAt: null,
        salesEndAt: pastDate,
        stock: 10
      };

      // Act
      const isAvailable = isProductSaleAvailable(product);

      // Assert
      expect(isAvailable).toBe(false);
    });
  });
});

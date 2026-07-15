import { prisma } from '../../shared/prisma';
import { DEFAULT_PAGE_SIZE } from '../../shared/types';

export interface MovieSearchParams {
  keyword?: string;
  genre?: string;
  status?: string;
  sort?: string;
  page?: number;
}

export const movieRepository = {
  /**
   * FR-003: 映画作品検索
   * C-DATA-001: status=published のみ表示
   */
  async search(params: MovieSearchParams) {
    const page = params.page ?? 1;
    const skip = (page - 1) * DEFAULT_PAGE_SIZE;

    const where = {
      status: 'published' as const,
      ...(params.keyword && {
        title: { contains: params.keyword, mode: 'insensitive' as const },
      }),
      ...(params.genre && { genre: params.genre }),
    };

    const [items, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip,
        take: DEFAULT_PAGE_SIZE,
        orderBy: params.sort === 'title' ? { title: 'asc' } : { releaseDate: 'desc' },
      }),
      prisma.movie.count({ where }),
    ]);

    return { items, total, page, perPage: DEFAULT_PAGE_SIZE };
  },

  /** FR-004: 映画詳細取得（関連商品・上映回含む） */
  async findById(id: string) {
    const now = new Date();
    return prisma.movie.findUnique({
      where: { id, status: 'published' },
      include: {
        products: {
          where: { publishStatus: 'published' },
          orderBy: { priceTaxIncluded: 'asc' },
        },
        screenings: {
          where: { startsAt: { gt: now } }, // 上映終了回は除外
          orderBy: { startsAt: 'asc' },
        },
      },
    });
  },
};

export interface ProductSearchParams {
  keyword?: string;
  movieId?: string;
  inStockOnly?: boolean;
  page?: number;
}

export const productRepository = {
  /**
   * FR-005: 商品検索
   * C-DATA-001: publishStatus=published のみ
   * C-DATA-002: 販売期間外は閲覧可能でも購入不可（isAvailableフラグで制御）
   */
  async search(params: ProductSearchParams) {
    const page = params.page ?? 1;
    const skip = (page - 1) * DEFAULT_PAGE_SIZE;
    const now = new Date();

    const where = {
      publishStatus: 'published' as const,
      ...(params.keyword && {
        name: { contains: params.keyword, mode: 'insensitive' as const },
      }),
      ...(params.movieId && { movieId: params.movieId }),
      ...(params.inStockOnly && { stock: { gt: 0 } }),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: DEFAULT_PAGE_SIZE,
        include: { movie: { select: { id: true, title: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        isAvailable:
          p.stock > 0 &&
          (!p.salesStartAt || p.salesStartAt <= now) &&
          (!p.salesEndAt || p.salesEndAt >= now),
      })),
      total,
      page,
      perPage: DEFAULT_PAGE_SIZE,
    };
  },

  findById: (id: string) =>
    prisma.product.findUnique({
      where: { id, publishStatus: 'published' },
      include: { movie: { select: { id: true, title: true } } },
    }),

  /** 在庫確認（FOR UPDATE 用ではない。注文確定は service 層でトランザクション使用） */
  findByIdForUpdate: (id: string, tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) =>
    tx.product.findUnique({ where: { id } }),
};

import { Request, Response, NextFunction } from 'express';
import { movieRepository, productRepository, MovieSearchParams, ProductSearchParams } from './movie-product.repository';
import { NotFoundError } from '../../shared/errors';

export const movieController = {
  /** GET /api/v1/movies — FR-003: 映画作品検索 */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const params: MovieSearchParams = {
        keyword: req.query.keyword as string | undefined,
        genre: req.query.genre as string | undefined,
        sort: req.query.sort as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
      };

      const result = await movieRepository.search(params);
      const totalPages = Math.ceil(result.total / result.perPage);
      res.json({ data: { ...result, totalPages } });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/movies/:id — FR-004: 映画作品詳細閲覧 */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await movieRepository.findById(req.params.id);
      if (!movie) return next(new NotFoundError('映画作品'));
      res.json({ data: movie });
    } catch (err) {
      next(err);
    }
  },
};

export const productController = {
  /** GET /api/v1/products — FR-005: 商品検索・閲覧 */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const params: ProductSearchParams = {
        keyword: req.query.keyword as string | undefined,
        movieId: req.query.movieId as string | undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        page: req.query.page ? Number(req.query.page) : 1,
      };

      const result = await productRepository.search(params);
      const totalPages = Math.ceil(result.total / result.perPage);
      res.json({ data: { ...result, totalPages } });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/products/:id — FR-005: 商品詳細 */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productRepository.findById(req.params.id);
      if (!product) return next(new NotFoundError('商品'));

      const now = new Date();
      const isAvailable =
        product.stock > 0 &&
        (!product.salesStartAt || product.salesStartAt <= now) &&
        (!product.salesEndAt || product.salesEndAt >= now);

      res.json({ data: { ...product, isAvailable } });
    } catch (err) {
      next(err);
    }
  },
};

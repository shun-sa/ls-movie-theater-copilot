// APIクライアント (ADR-001: /api/v1/ プレフィクス統一)
// ADR-002: credentials: 'include' でCookieを自動送信

const BASE_URL = '/api/v1';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include', // ADR-002: HttpOnly Cookie を送信
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message ?? 'エラーが発生しました') as Error & {
      statusCode: number;
      code: string;
      fields?: Record<string, string>;
    };
    err.statusCode = res.status;
    err.code = json.error;
    err.fields = json.fields;
    throw err;
  }

  return json as T;
}

// 認証 (FR-001, FR-002)
export const authApi = {
  register: (body: { name: string; email: string; password: string; passwordConfirm: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request<{ data: { id: string; name: string; email: string } }>('/auth/me'),
};

// 映画 (FR-003, FR-004)
export const movieApi = {
  search: (params: { keyword?: string; genre?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.genre) q.set('genre', params.genre);
    if (params.page) q.set('page', String(params.page));
    return request<{ data: { items: Movie[]; total: number; page: number; totalPages: number } }>(`/movies?${q}`);
  },

  findById: (id: string) =>
    request<{ data: Movie & { products: Product[]; screenings: Screening[] } }>(`/movies/${id}`),
};

// 商品 (FR-005)
export const productApi = {
  search: (params: { keyword?: string; movieId?: string; inStockOnly?: boolean; page?: number }) => {
    const q = new URLSearchParams();
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.movieId) q.set('movieId', params.movieId);
    if (params.inStockOnly) q.set('inStockOnly', 'true');
    if (params.page) q.set('page', String(params.page));
    return request<{ data: { items: Product[]; total: number; page: number; totalPages: number } }>(`/products?${q}`);
  },

  findById: (id: string) =>
    request<{ data: Product & { isAvailable: boolean } }>(`/products/${id}`),
};

// カート (FR-006, FR-007)
export const cartApi = {
  get: () => request<{ data: Cart }>('/cart'),
  addItem: (body: { productId: string; quantity: number }) =>
    request('/cart/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (productId: string, quantity: number) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeItem: (productId: string) =>
    request(`/cart/items/${productId}`, { method: 'DELETE' }),
};

// 注文 (FR-008, FR-010)
export const orderApi = {
  create: (body: OrderInput) =>
    request<{ data: Order; message: string }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  list: (page?: number) => {
    const q = page ? `?page=${page}` : '';
    return request<{ data: { items: Order[]; total: number; totalPages: number } }>(`/orders${q}`);
  },
  findById: (id: string) =>
    request<{ data: Order }>(`/orders/${id}`),
};

// チケット (FR-009, FR-010)
export const ticketApi = {
  purchase: (body: TicketInput) =>
    request<{ data: TicketPurchase; message: string }>('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  list: (page?: number) => {
    const q = page ? `?page=${page}` : '';
    return request<{ data: { items: TicketPurchase[]; total: number; totalPages: number } }>(`/tickets${q}`);
  },
  findById: (id: string) =>
    request<{ data: TicketPurchase }>(`/tickets/${id}`),
};

// ---- 型定義 ----
export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  releaseDate: string;
  runtimeMinutes: number;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  priceTaxIncluded: number;
  stock: number;
  publishStatus: string;
  salesStartAt: string | null;
  salesEndAt: string | null;
  movieId: string | null;
  movie?: { id: string; title: string } | null;
}

export interface Screening {
  id: string;
  movieId: string;
  startsAt: string;
  theaterName: string;
  screenName: string;
  seatsRemaining: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  orderedAt: string;
  status: string;
  totalAmount: number;
  shippingName: string;
  paymentMethod: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productSnapshotName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderInput {
  shippingName: string;
  postalCode: string;
  prefecture: string;
  addressLine: string;
  phoneNumber: string;
  paymentMethod: string;
}

export interface TicketPurchase {
  id: string;
  purchaseNumber: string;
  userId: string;
  purchasedAt: string;
  totalAmount: number;
  items: TicketPurchaseItem[];
}

export interface TicketPurchaseItem {
  id: string;
  screeningId: string;
  ticketType: string;
  unitPrice: number;
  quantity: number;
  screening: Screening & { movie: { id: string; title: string } };
}

export interface TicketInput {
  screeningId: string;
  ticketType: '一般' | '学生' | 'シニア';
  quantity: number;
  paymentMethod: string;
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // テストユーザー作成 (ADR-006: bcrypt cost factor=12)
  const passwordHash = await bcrypt.hash('Password1', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'テスト太郎',
      email: 'test@example.com',
      passwordHash,
    },
  });
  console.log('✅ User:', user.email);

  // 映画データ
  const movies = await Promise.all([
    prisma.movie.upsert({
      where: { id: 'movie-001' },
      update: {},
      create: {
        id: 'movie-001',
        title: '宇宙大冒険',
        synopsis: '近未来を舞台に宇宙を駆け巡る壮大なSFアクション映画。主人公は銀河系の謎を解くために仲間とともに旅立つ。',
        genre: 'SF',
        releaseDate: new Date('2025-06-01'),
        runtimeMinutes: 135,
        status: 'published',
      },
    }),
    prisma.movie.upsert({
      where: { id: 'movie-002' },
      update: {},
      create: {
        id: 'movie-002',
        title: '青春の彼方',
        synopsis: '高校生の主人公が夢と友情の間で葛藤する青春ドラマ。',
        genre: 'ドラマ',
        releaseDate: new Date('2025-09-15'),
        runtimeMinutes: 118,
        status: 'published',
      },
    }),
  ]);
  console.log('✅ Movies:', movies.map((m) => m.title).join(', '));

  // 商品データ
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-001' },
      update: {},
      create: {
        id: 'product-001',
        name: '宇宙大冒険 Tシャツ（Mサイズ）',
        priceTaxIncluded: 2980,
        stock: 50,
        publishStatus: 'published',
        movieId: 'movie-001',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-002' },
      update: {},
      create: {
        id: 'product-002',
        name: '宇宙大冒険 マグカップ',
        priceTaxIncluded: 1980,
        stock: 30,
        publishStatus: 'published',
        movieId: 'movie-001',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-003' },
      update: {},
      create: {
        id: 'product-003',
        name: '青春の彼方 クリアファイルセット',
        priceTaxIncluded: 880,
        stock: 100,
        publishStatus: 'published',
        movieId: 'movie-002',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-004' },
      update: {},
      create: {
        id: 'product-004',
        name: '映画館オリジナルポップコーンBOX',
        priceTaxIncluded: 1200,
        stock: 0, // 在庫なし (C-DATA-003検証用)
        publishStatus: 'published',
      },
    }),
  ]);
  console.log('✅ Products:', products.map((p) => p.name).join(', '));

  // 上映回データ
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const screenings = await Promise.all([
    prisma.screening.upsert({
      where: { id: 'screening-001' },
      update: {},
      create: {
        id: 'screening-001',
        movieId: 'movie-001',
        startsAt: new Date(tomorrow.setHours(14, 0, 0, 0)),
        theaterName: '新宿シネマ',
        screenName: 'スクリーン1',
        seatsRemaining: 50,
      },
    }),
    prisma.screening.upsert({
      where: { id: 'screening-002' },
      update: {},
      create: {
        id: 'screening-002',
        movieId: 'movie-001',
        startsAt: new Date(dayAfter.setHours(18, 30, 0, 0)),
        theaterName: '新宿シネマ',
        screenName: 'スクリーン2',
        seatsRemaining: 30,
      },
    }),
    prisma.screening.upsert({
      where: { id: 'screening-003' },
      update: {},
      create: {
        id: 'screening-003',
        movieId: 'movie-002',
        startsAt: new Date(tomorrow.setHours(11, 0, 0, 0)),
        theaterName: '渋谷シアター',
        screenName: 'スクリーンA',
        seatsRemaining: 80,
      },
    }),
  ]);
  console.log('✅ Screenings:', screenings.length, '件');

  console.log('\n🎉 Seed complete!');
  console.log('テストアカウント: test@example.com / Password1');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

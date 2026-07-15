import { prisma } from '../../shared/prisma';

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, status: true },
    }),

  create: (data: { name: string; email: string; passwordHash: string }) =>
    prisma.user.create({
      data,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
};

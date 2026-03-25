import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  role: Role;
  airlineId: string | null;
}

export class FavoritesService {
  /**
   * Get all favorited chapters for the current user.
   * SUPER_ADMIN can see all airlines; others are scoped to their airlineId.
   */
  async getAll(user: User) {
    const favorites = await prisma.chapterFavorite.findMany({
      where: {
        userId: user.id,
        // Ensure tenant isolation: only return favorites whose chapter belongs
        // to the user's airline (SUPER_ADMIN has no restriction).
        ...(user.role !== 'SUPER_ADMIN' && {
          chapter: {
            airlineId: user.airlineId!,
          },
        }),
      },
      include: {
        chapter: {
          include: {
            airline: {
              select: { id: true, name: true, code: true, logo: true },
            },
            _count: {
              select: { sections: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites;
  }

  /**
   * Get only the chapter IDs the current user has favorited.
   * Lightweight endpoint used to render heart-toggle states across the app.
   */
  async getFavoriteIds(user: User): Promise<string[]> {
    const favorites = await prisma.chapterFavorite.findMany({
      where: {
        userId: user.id,
        ...(user.role !== 'SUPER_ADMIN' && {
          chapter: { airlineId: user.airlineId! },
        }),
      },
      select: { chapterId: true },
    });

    return favorites.map((f) => f.chapterId);
  }

  /**
   * Add a chapter to the current user's favorites.
   * Uses upsert so duplicate requests are safe (idempotent).
   */
  async add(chapterId: string, user: User) {
    // Verify chapter exists
    const chapter = await prisma.manualChapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      const error: any = new Error('Chapter not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforce tenant isolation: non-super-admins can only favorite chapters
    // that belong to their own airline.
    if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
      const error: any = new Error('Access denied to this chapter');
      error.statusCode = 403;
      throw error;
    }

    const favorite = await prisma.chapterFavorite.upsert({
      where: {
        userId_chapterId: { userId: user.id, chapterId },
      },
      create: { userId: user.id, chapterId },
      update: {}, // already exists — no-op
      include: {
        chapter: {
          include: {
            airline: {
              select: { id: true, name: true, code: true, logo: true },
            },
            _count: { select: { sections: true } },
          },
        },
      },
    });

    return favorite;
  }

  /**
   * Remove a chapter from the current user's favorites.
   */
  async remove(chapterId: string, user: User) {
    const existing = await prisma.chapterFavorite.findUnique({
      where: {
        userId_chapterId: { userId: user.id, chapterId },
      },
      include: {
        chapter: { select: { airlineId: true } },
      },
    });

    if (!existing) {
      const error: any = new Error('Favorite not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforce tenant isolation
    if (
      user.role !== 'SUPER_ADMIN' &&
      existing.chapter.airlineId !== user.airlineId
    ) {
      const error: any = new Error('Access denied to this chapter');
      error.statusCode = 403;
      throw error;
    }

    await prisma.chapterFavorite.delete({
      where: {
        userId_chapterId: { userId: user.id, chapterId },
      },
    });

    return true;
  }
}
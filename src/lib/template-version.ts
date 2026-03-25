import { prisma } from './prisma';

/**
 * If the given chapterId belongs to a template chapter,
 * increment its templateVersion.
 * Call this after any section or content mutation.
 */
export async function bumpTemplateVersionIfNeeded(
  chapterId: string
): Promise<void> {
  const chapter = await prisma.manualChapter.findUnique({
    where: { id: chapterId },
    select: { id: true, isTemplate: true, templateVersion: true },
  });

  if (!chapter?.isTemplate) return;

  await prisma.manualChapter.update({
    where: { id: chapter.id },
    data: { templateVersion: { increment: 1 } },
  });
}
// services/search.service.ts
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';


interface Airline {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  email: string;
  role: Role;
  airlineId: string | null;
}

interface SearchResult {
  type: 'chapter' | 'section' | 'content';
  id: string;
  title: string;
  description?: string;
  content?: string;
  chapterId: string;
  chapterTitle: string;
  sectionId?: string;
  sectionTitle?: string;
  order: number;
  relevance: number;
}

export class SearchService {
  // async globalSearch(query: string, user: User, options?: {
  //   includeInactive?: boolean;
  //   limit?: number;
  // }): Promise<SearchResult[]> {
  //   const includeInactive = options?.includeInactive || false;
  //   const limit = options?.limit || 50;

  //   if (!query || query.trim().length === 0) {
  //     const error = new Error('Search query is required') as Error & { statusCode?: number };
  //     error.statusCode = 400;
  //     throw error;
  //   }

  //   const searchTerm = query.trim();
  //   const results: SearchResult[] = [];

  //   // Base where clause for tenant isolation
  //   const tenantWhere = user.role !== 'SUPER_ADMIN' && user.airlineId
  //     ? { airlineId: user.airlineId }
  //     : {};

  //   const activeWhere = includeInactive ? {} : { active: true };

  //   try {
  //     // Search in Chapters
  //     const chapters = await prisma.manualChapter.findMany({
  //       where: {
  //         ...tenantWhere,
  //         ...activeWhere,
  //         OR: [
  //           { title: { contains: searchTerm, mode: 'insensitive' } },
  //           { description: { contains: searchTerm, mode: 'insensitive' } },
  //         ],
  //       },
  //       include: {
  //         airline: {
  //           select: {
  //             id: true,
  //             name: true,
  //             code: true,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         order: 'asc',
  //       },
  //     });

  //     // Add chapters to results
  //     chapters.forEach(chapter => {
  //       const titleMatch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase());
  //       const descMatch = chapter.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        
  //       results.push({
  //         type: 'chapter',
  //         id: chapter.id,
  //         title: chapter.title,
  //         description: chapter.description || undefined,
  //         chapterId: chapter.id,
  //         chapterTitle: chapter.title,
  //         order: chapter.order,
  //         relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
  //       });
  //     });

  //     // Search in Sections
  //     const sections = await prisma.manualSection.findMany({
  //       where: {
  //         ...activeWhere,
  //         chapter: {
  //           ...tenantWhere,
  //           ...activeWhere,
  //         },
  //         OR: [
  //           { title: { contains: searchTerm, mode: 'insensitive' } },
  //           { description: { contains: searchTerm, mode: 'insensitive' } },
  //         ],
  //       },
  //       include: {
  //         chapter: {
  //           select: {
  //             id: true,
  //             title: true,
  //             airlineId: true,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         order: 'asc',
  //       },
  //     });

  //     // Add sections to results
  //     sections.forEach(section => {
  //       const titleMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
  //       const descMatch = section.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

  //       results.push({
  //         type: 'section',
  //         id: section.id,
  //         title: section.title,
  //         description: section.description || undefined,
  //         chapterId: section.chapter.id,
  //         chapterTitle: section.chapter.title,
  //         sectionId: section.id,
  //         sectionTitle: section.title,
  //         order: section.order,
  //         relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
  //       });
  //     });

  //     // Search in Content
  //     const contents = await prisma.manualContent.findMany({
  //       where: {
  //         ...activeWhere,
  //         section: {
  //           ...activeWhere,
  //           chapter: {
  //             ...tenantWhere,
  //             ...activeWhere,
  //           },
  //         },
  //         OR: [
  //           { title: { contains: searchTerm, mode: 'insensitive' } },
  //           { content: { contains: searchTerm, mode: 'insensitive' } },
  //         ],
  //       },
  //       include: {
  //         section: {
  //           select: {
  //             id: true,
  //             title: true,
  //             chapter: {
  //               select: {
  //                 id: true,
  //                 title: true,
  //                 airlineId: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: {
  //         order: 'asc',
  //       },
  //       take: limit,
  //     });

  //     // Add contents to results
  //     contents.forEach(content => {
  //       const titleMatch = content.title.toLowerCase().includes(searchTerm.toLowerCase());
  //       const contentMatch = content.content.toLowerCase().includes(searchTerm.toLowerCase());

  //       results.push({
  //         type: 'content',
  //         id: content.id,
  //         title: content.title,
  //         content: this.getContentExcerpt(content.content, searchTerm),
  //         chapterId: content.section.chapter.id,
  //         chapterTitle: content.section.chapter.title,
  //         sectionId: content.section.id,
  //         sectionTitle: content.section.title,
  //         order: content.order,
  //         relevance: titleMatch ? 3 : (contentMatch ? 2 : 1),
  //       });
  //     });

  //     // Sort by relevance (highest first), then by chapter order
  //     results.sort((a, b) => {
  //       if (b.relevance !== a.relevance) {
  //         return b.relevance - a.relevance;
  //       }
  //       return a.order - b.order;
  //     });

  //     // Limit total results
  //     return results.slice(0, limit);

  //   } catch (error) {
  //     console.error('Search error:', error);
  //     const err = new Error('Search failed') as Error & { statusCode?: number };
  //     err.statusCode = 500;
  //     throw err;
  //   }
  // }

  async globalSearch(query: string, user: User, options?: {
  includeInactive?: boolean;
  limit?: number;
}): Promise<SearchResult[]> {
  const includeInactive = options?.includeInactive || false;
  const limit = options?.limit || 50;

  if (!query || query.trim().length === 0) {
    const error = new Error('Search query is required') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const searchTerm = query.trim();
  const results: SearchResult[] = [];

  // Base where clause for tenant isolation
  const tenantWhere = user.role !== 'SUPER_ADMIN' && user.airlineId
    ? { airlineId: user.airlineId }
    : {};

  const activeWhere = includeInactive ? {} : { active: true };

  try {
    // Get user's airline info for placeholder replacement
    let userAirline: Airline | null = null;
    if (user.airlineId) {
      const airline = await prisma.airline.findUnique({
        where: { id: user.airlineId },
        select: { id: true, name: true, code: true },
      });
      userAirline = airline;
    }

    // Search in Chapters
    const chapters = await prisma.manualChapter.findMany({
      where: {
        ...tenantWhere,
        ...activeWhere,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        airline: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Add chapters to results
    chapters.forEach(chapter => {
      const titleMatch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = chapter.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      results.push({
        type: 'chapter',
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || undefined,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        order: chapter.order,
        relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
      });
    });

    // Search in Sections
    const sections = await prisma.manualSection.findMany({
      where: {
        ...activeWhere,
        chapter: {
          ...tenantWhere,
          ...activeWhere,
        },
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            airlineId: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Add sections to results
    sections.forEach(section => {
      const titleMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = section.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

      results.push({
        type: 'section',
        id: section.id,
        title: section.title,
        description: section.description || undefined,
        chapterId: section.chapter.id,
        chapterTitle: section.chapter.title,
        sectionId: section.id,
        sectionTitle: section.title,
        order: section.order,
        relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
      });
    });

    // Search in Content - UPDATED to search both raw and replaced content
    const contents = await prisma.manualContent.findMany({
      where: {
        ...activeWhere,
        section: {
          ...activeWhere,
          chapter: {
            ...tenantWhere,
            ...activeWhere,
          },
        },
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                airlineId: true,
                airline: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
      take: limit * 2, // Get more results to filter later
    });

    // Filter and add contents to results
    contents.forEach(content => {
      const airline = content.section.chapter.airline || userAirline;
      const processedContent = this.replacePlaceholders(content.content, airline);
      const processedTitle = this.replacePlaceholders(content.title, airline);
      
      const titleMatch = processedTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const contentMatch = processedContent.toLowerCase().includes(searchTerm.toLowerCase());

      // Only include if there's a match after replacement
      if (titleMatch || contentMatch) {
        results.push({
          type: 'content',
          id: content.id,
          title: processedTitle,
          content: this.getContentExcerpt(content.content, searchTerm, airline),
          chapterId: content.section.chapter.id,
          chapterTitle: content.section.chapter.title,
          sectionId: content.section.id,
          sectionTitle: content.section.title,
          order: content.order,
          relevance: titleMatch ? 3 : (contentMatch ? 2 : 1),
        });
      }
    });

    // Sort by relevance (highest first), then by chapter order
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return a.order - b.order;
    });

    // Limit total results
    return results.slice(0, limit);

  } catch (error) {
    console.error('Search error:', error);
    const err = new Error('Search failed') as Error & { statusCode?: number };
    err.statusCode = 500;
    throw err;
  }
  }
  

  // async searchInChapter(chapterId: string, query: string, user: User): Promise<SearchResult[]> {
  //   if (!query || query.trim().length === 0) {
  //     const error = new Error('Search query is required') as Error & { statusCode?: number };
  //     error.statusCode = 400;
  //     throw error;
  //   }

  //   // Verify chapter exists and user has access
  //   const chapter = await prisma.manualChapter.findUnique({
  //     where: { id: chapterId },
  //   });

  //   if (!chapter) {
  //     const error = new Error('Chapter not found') as Error & { statusCode?: number };
  //     error.statusCode = 404;
  //     throw error;
  //   }

  //   // Verify tenant isolation
  //   if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
  //     const error = new Error('Access denied to this chapter') as Error & { statusCode?: number };
  //     error.statusCode = 403;
  //     throw error;
  //   }

  //   const searchTerm = query.trim();
  //   const results: SearchResult[] = [];

  //   // Search in sections within this chapter
  //   const sections = await prisma.manualSection.findMany({
  //     where: {
  //       chapterId,
  //       active: true,
  //       OR: [
  //         { title: { contains: searchTerm, mode: 'insensitive' } },
  //         { description: { contains: searchTerm, mode: 'insensitive' } },
  //       ],
  //     },
  //     include: {
  //       chapter: {
  //         select: {
  //           id: true,
  //           title: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       order: 'asc',
  //     },
  //   });

  //   sections.forEach(section => {
  //     const titleMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
  //     const descMatch = section.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

  //     results.push({
  //       type: 'section',
  //       id: section.id,
  //       title: section.title,
  //       description: section.description || undefined,
  //       chapterId: section.chapter.id,
  //       chapterTitle: section.chapter.title,
  //       sectionId: section.id,
  //       sectionTitle: section.title,
  //       order: section.order,
  //       relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
  //     });
  //   });

  //   // Search in content within this chapter
  //   const contents = await prisma.manualContent.findMany({
  //     where: {
  //       active: true,
  //       section: {
  //         chapterId,
  //         active: true,
  //       },
  //       OR: [
  //         { title: { contains: searchTerm, mode: 'insensitive' } },
  //         { content: { contains: searchTerm, mode: 'insensitive' } },
  //       ],
  //     },
  //     include: {
  //       section: {
  //         select: {
  //           id: true,
  //           title: true,
  //           chapter: {
  //             select: {
  //               id: true,
  //               title: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: {
  //       order: 'asc',
  //     },
  //   });

  //   contents.forEach(content => {
  //     const titleMatch = content.title.toLowerCase().includes(searchTerm.toLowerCase());
  //     const contentMatch = content.content.toLowerCase().includes(searchTerm.toLowerCase());

  //     results.push({
  //       type: 'content',
  //       id: content.id,
  //       title: content.title,
  //       content: this.getContentExcerpt(content.content, searchTerm),
  //       chapterId: content.section.chapter.id,
  //       chapterTitle: content.section.chapter.title,
  //       sectionId: content.section.id,
  //       sectionTitle: content.section.title,
  //       order: content.order,
  //       relevance: titleMatch ? 3 : (contentMatch ? 2 : 1),
  //     });
  //   });

  //   // Sort by relevance
  //   results.sort((a, b) => {
  //     if (b.relevance !== a.relevance) {
  //       return b.relevance - a.relevance;
  //     }
  //     return a.order - b.order;
  //   });

  //   return results;
  // }

  async searchInChapter(chapterId: string, query: string, user: User): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    const error = new Error('Search query is required') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Verify chapter exists and user has access
  const chapter = await prisma.manualChapter.findUnique({
    where: { id: chapterId },
    include: {
      airline: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!chapter) {
    const error = new Error('Chapter not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  // Verify tenant isolation
  if (user.role !== 'SUPER_ADMIN' && chapter.airlineId !== user.airlineId) {
    const error = new Error('Access denied to this chapter') as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }

  const searchTerm = query.trim();
  const results: SearchResult[] = [];
  const airline = chapter.airline;

  // Search in sections within this chapter
  const sections = await prisma.manualSection.findMany({
    where: {
      chapterId,
      active: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  sections.forEach(section => {
    const titleMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = section.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

    results.push({
      type: 'section',
      id: section.id,
      title: section.title,
      description: section.description || undefined,
      chapterId: section.chapter.id,
      chapterTitle: section.chapter.title,
      sectionId: section.id,
      sectionTitle: section.title,
      order: section.order,
      relevance: titleMatch ? 3 : (descMatch ? 2 : 1),
    });
  });

  // Search in content within this chapter
  const contents = await prisma.manualContent.findMany({
    where: {
      active: true,
      section: {
        chapterId,
        active: true,
      },
    },
    include: {
      section: {
        select: {
          id: true,
          title: true,
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  contents.forEach(content => {
    const processedContent = this.replacePlaceholders(content.content, airline);
    const processedTitle = this.replacePlaceholders(content.title, airline);
    
    const titleMatch = processedTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const contentMatch = processedContent.toLowerCase().includes(searchTerm.toLowerCase());

    if (titleMatch || contentMatch) {
      results.push({
        type: 'content',
        id: content.id,
        title: processedTitle,
        content: this.getContentExcerpt(content.content, searchTerm, airline),
        chapterId: content.section.chapter.id,
        chapterTitle: content.section.chapter.title,
        sectionId: content.section.id,
        sectionTitle: content.section.title,
        order: content.order,
        relevance: titleMatch ? 3 : (contentMatch ? 2 : 1),
      });
    }
  });

  // Sort by relevance
  results.sort((a, b) => {
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    return a.order - b.order;
  });

  return results;
  }
  

  // Helper method to get excerpt around search term
  // private getContentExcerpt(content: string, searchTerm: string, contextLength: number = 150): string {
  //   const lowerContent = content.toLowerCase();
  //   const lowerTerm = searchTerm.toLowerCase();
  //   const index = lowerContent.indexOf(lowerTerm);

  //   if (index === -1) {
  //     return content.substring(0, contextLength) + '...';
  //   }

  //   const start = Math.max(0, index - contextLength / 2);
  //   const end = Math.min(content.length, index + searchTerm.length + contextLength / 2);

  //   let excerpt = content.substring(start, end);
    
  //   if (start > 0) {
  //     excerpt = '...' + excerpt;
  //   }
  //   if (end < content.length) {
  //     excerpt = excerpt + '...';
  //   }

  //   return excerpt;
  // }

  private getContentExcerpt(
  content: string, 
  searchTerm: string, 
  airline: Airline | null,
  contextLength: number = 150
): string {
  // Replace placeholders first
  const processedContent = this.replacePlaceholders(content, airline);
  
  const lowerContent = processedContent.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);

  if (index === -1) {
    return processedContent.substring(0, contextLength) + '...';
  }

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(processedContent.length, index + searchTerm.length + contextLength / 2);

  let excerpt = processedContent.substring(start, end);
  
  if (start > 0) {
    excerpt = '...' + excerpt;
  }
  if (end < processedContent.length) {
    excerpt = excerpt + '...';
  }

  return excerpt;
}

  private replacePlaceholders(content: string, airline: Airline | null): string {
  if (!content) return content;
  
  let replaced = content;
  
  // Replace {{CONTACT_BUTTON}} with empty string or descriptive text for search
  replaced = replaced.replace(/\{\{CONTACT_BUTTON\}\}/g, 'contact page');
  
  // Replace {{name}} with airline name
  if (airline?.name) {
    replaced = replaced.replace(/\{\{name\}\}/g, airline.name);
  }
  
  // Add more placeholder replacements as needed
  // replaced = replaced.replace(/\{\{code\}\}/g, airline?.code || '');
  
  return replaced;
}
}
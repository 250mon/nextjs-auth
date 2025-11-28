export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

// Path utilities for basePath handling
// These are safe to import in Edge Runtime (middleware) as they don't import database code
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function createUrl(path: string, baseUrl: URL): URL {
  const pathWithBase = basePath ? `${basePath}${path}` : path;
  return new URL(pathWithBase, baseUrl);
}

// Helper function to get image source path with basePath support
// When basePath is set, we need to explicitly include it in image paths
// because Next.js Image component with unoptimized images doesn't always handle basePath correctly
export function getImageSrc(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // If basePath is set, prepend it to the path
  // This is necessary when image optimization is disabled
  return basePath ? `${basePath}${normalizedPath}` : normalizedPath;
}

// Environment utilities
export const env = {
  get isDevelopment() { return process.env.NODE_ENV === 'development'; },
  get isProduction() { return process.env.NODE_ENV === 'production'; },
  get isTest() { return process.env.NODE_ENV === 'test'; },
  
  // Database utilities
  getDatabaseUrl: () => {
    const url = process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    return url;
  },
  
  // Safe database URL for logging (hides password)
  getSafeDbUrl: () => {
    const url = process.env.POSTGRES_URL;
    return url?.replace(/:[^:@]*@/, ':***@') || 'Not set';
  },
  
  // Environment info for debugging
  getEnvInfo: () => ({
    nodeEnv: process.env.NODE_ENV,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    isTest: env.isTest,
    hasDbUrl: !!process.env.POSTGRES_URL,
    safeDbUrl: env.getSafeDbUrl(),
    authConfigured: !!process.env.AUTH_SECRET,
  })
};
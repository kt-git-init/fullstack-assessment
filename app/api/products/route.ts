import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_SEARCH_LENGTH = 100;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Validate and sanitize limit
  const rawLimit = searchParams.get('limit');
  const limit = rawLimit 
    ? Math.min(Math.max(1, parseInt(rawLimit)), MAX_LIMIT) 
    : DEFAULT_LIMIT;

  // Validate and sanitize offset
  const rawOffset = searchParams.get('offset');
  const offset = rawOffset ? Math.max(0, parseInt(rawOffset)) : 0;

  // Check for invalid numbers
  if ((rawLimit && isNaN(limit)) || (rawOffset && isNaN(offset))) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters' },
      { status: 400 }
    );
  }

  // Validate search query length
  const search = searchParams.get('search') || undefined;
  if (search && search.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json(
      { error: 'Search query too long' },
      { status: 400 }
    );
  }

  const filters = {
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || undefined,
    search,
    limit,
    offset,
  };

  const products = productService.getAll(filters);
  const total = productService.getTotalCount({
    category: filters.category,
    subCategory: filters.subCategory,
    search: filters.search,
  });

  return NextResponse.json({
    products,
    total,
    limit: filters.limit,
    offset: filters.offset,
  });
}

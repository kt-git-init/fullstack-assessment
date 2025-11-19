"use client";

import { useState, useEffect, Fragment, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartIcon } from "@/components/cart-icon";
import { WishlistIcon } from "@/components/wishlist-icon";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  retailPrice?: number;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get("category") || undefined
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    string | undefined
  >(searchParams.get("subcategory") || undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 20;
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [priceFromInput, setPriceFromInput] = useState<string>("0");
  const [priceToInput, setPriceToInput] = useState<string>("10000");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch categories:', error);
        }
      });
  }, []);

  // Update URL when filters or pagination change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSubCategory) params.set("subcategory", selectedSubCategory);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    const newURL = params.toString() ? `/?${params.toString()}` : "/";
    const currentURL = window.location.pathname + window.location.search;
    
    // Only update URL if it's different to avoid unnecessary history entries
    if (currentURL !== newURL) {
      router.push(newURL, { scroll: false });
    }
  }, [search, selectedCategory, selectedSubCategory, currentPage, router]);

  // Sync state with URL when user uses browser back/forward buttons
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || undefined);
    setSelectedSubCategory(searchParams.get("subcategory") || undefined);
    setCurrentPage(parseInt(searchParams.get("page") || "1"));
  }, [searchParams]);

  useEffect(() => {
    // Always reset subcategory when category changes
    setSelectedSubCategory(undefined);
    
    if (selectedCategory) {
      fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
        .then((res) => res.json())
        .then((data) => setSubCategories(data.subCategories))
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to fetch subcategories:', error);
          }
          setSubCategories([]);
        });
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    // Debounce search input
    const timeoutId = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();

      // When searching or price filtering, fetch all products for client-side filtering
      if (search || isPriceFilterActive) {
        if (search) params.append("search", search);
        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
        params.append("limit", "100"); // Higher limit for client-side filtering
        params.append("offset", "0");
      } else {
        // When not searching or filtering, use server-side pagination
        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
        params.append("limit", productsPerPage.toString());
        params.append("offset", ((currentPage - 1) * productsPerPage).toString());
      }

      fetch(`/api/products?${params}`)
        .then((res) => {
          if (res.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          if (!res.ok) {
            throw new Error('Failed to fetch products. Please try again.');
          }
          return res.json();
        })
        .then((data) => {
          // Normalize products to ensure imageUrls is always an array
          let normalizedProducts = data.products.map((product: Product) => ({
            ...product,
            imageUrls: product.imageUrls || [],
          }));
          
          // Apply client-side price filter only if user has actively changed it
          if (isPriceFilterActive) {
            normalizedProducts = normalizedProducts.filter((product: Product) => {
              if (!product.retailPrice) return false;
              // If max price is very high (indicating "no limit"), only check minimum
              if (priceRange[1] >= 50000) {
                return product.retailPrice >= priceRange[0];
              }
              return product.retailPrice >= priceRange[0] && product.retailPrice <= priceRange[1];
            });
            // Client-side pagination when filtering
            const startIndex = (currentPage - 1) * productsPerPage;
            const paginatedProducts = normalizedProducts.slice(startIndex, startIndex + productsPerPage);
            setProducts(paginatedProducts);
            setTotalProducts(normalizedProducts.length);
          } else if (search) {
            // Client-side pagination for search results
            const startIndex = (currentPage - 1) * productsPerPage;
            const paginatedProducts = normalizedProducts.slice(startIndex, startIndex + productsPerPage);
            setProducts(paginatedProducts);
            setTotalProducts(normalizedProducts.length);
          } else {
            // Server-side pagination
            setProducts(normalizedProducts);
            setTotalProducts(data.total || normalizedProducts.length);
          }
          
          setLoading(false);
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to fetch products:', error);
          }
          if (error instanceof TypeError) {
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            setError(error.message || 'Failed to load products. Please try again.');
          }
          setLoading(false);
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, selectedCategory, selectedSubCategory, currentPage, productsPerPage, priceRange, isPriceFilterActive]);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to Content Link for Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <header className="border-b shadow-sm sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity text-foreground dark:bg-gradient-to-r dark:from-primary dark:to-primary/60 dark:bg-clip-text dark:text-transparent"
              onClick={() => {
                setSearch("");
                setSelectedCategory(undefined);
                setSelectedSubCategory(undefined);
                setPriceRange([0, 10000]);
                setPriceFromInput("0");
                setPriceToInput("10000");
                setIsPriceFilterActive(false);
                setCurrentPage(1);
              }}
            >
              StackShop
            </h1>
            <div className="flex items-center gap-2">
              <WishlistIcon />
              <CartIcon />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                aria-label="Search products"
                value={search}
                maxLength={100}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setSearch(value);
                    // Clear category filters when starting a search for global results
                    if (value) {
                      setSelectedCategory(undefined);
                      setSelectedSubCategory(undefined);
                    }
                  }
                }}
                className="pl-10"
              />
            </div>

            <Select
              key={`category-${selectedCategory || "all"}`}
              value={selectedCategory}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedCategory(undefined);
                  setSelectedSubCategory(undefined);
                } else {
                  setSelectedCategory(value);
                  // Clear search when selecting a category for category-specific browsing
                  if (search) {
                    setSearch("");
                  }
                }
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 1 && (
              <Select
                key={`subcategory-${selectedSubCategory || "all"}-${selectedCategory}`}
                value={selectedSubCategory}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedSubCategory(undefined);
                  } else {
                    setSelectedSubCategory(value);
                  }
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(search || selectedCategory || selectedSubCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory(undefined);
                  setSelectedSubCategory(undefined);
                  setPriceRange([0, 10000]);
                  setPriceFromInput("0");
                  setPriceToInput("10000");
                  setIsPriceFilterActive(false);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="mb-3 text-sm"
            >
              Advanced Filters
              {showAdvancedFilters ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>

            {showAdvancedFilters && (
              <Card className="p-6 shadow-sm bg-card">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-foreground">
                      Price Range
                    </label>
                    <div className="flex items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <label htmlFor="price-from" className="text-xs font-medium text-muted-foreground">
                          Minimum Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="price-from"
                            type="number"
                            min={0}
                            max={priceRange[1]}
                            value={priceFromInput}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              setPriceFromInput(inputValue);
                              // Empty value means 0 (no minimum)
                              const numValue = inputValue === "" ? 0 : Math.max(0, parseInt(inputValue));
                              if (inputValue === "" || !isNaN(numValue)) {
                                setPriceRange([numValue, priceRange[1]]);
                                setIsPriceFilterActive(true);
                              }
                            }}
                            onBlur={() => {
                              // If empty, set to 0
                              if (priceFromInput === "") {
                                setPriceFromInput("0");
                                setPriceRange([0, priceRange[1]]);
                              } else {
                                const numValue = Math.max(0, parseInt(priceFromInput) || 0);
                                setPriceFromInput(numValue.toString());
                              }
                            }}
                            className="pl-7 h-11"
                            placeholder="0"
                            aria-label="Minimum price"
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-muted-foreground pb-3 font-medium">
                        to
                      </div>
                      <div className="flex-1 space-y-2">
                        <label htmlFor="price-to" className="text-xs font-medium text-muted-foreground">
                          Maximum Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="price-to"
                            type="number"
                            min={priceRange[0]}
                            max={100000}
                            value={priceToInput}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              setPriceToInput(inputValue);
                              // Empty value means "no maximum limit" - use a very high number
                              const numValue = inputValue === "" ? 999999 : Math.max(priceRange[0], parseInt(inputValue));
                              if (inputValue === "" || !isNaN(numValue)) {
                                setPriceRange([priceRange[0], numValue]);
                                setIsPriceFilterActive(true);
                              }
                            }}
                            onBlur={() => {
                              // If empty, leave it empty to indicate "no limit"
                              if (priceToInput === "") {
                                setPriceRange([priceRange[0], 999999]);
                              } else {
                                const numValue = Math.max(priceRange[0], parseInt(priceToInput) || 10000);
                                setPriceToInput(numValue.toString());
                              }
                            }}
                            className="pl-7 h-11"
                            placeholder="No limit"
                            aria-label="Maximum price"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>
                        {priceRange[1] >= 50000 
                          ? `Showing products $${priceRange[0]} and above`
                          : `Showing products from $${priceRange[0]} to $${priceRange[1]}`
                        }
                        {priceToInput === "" && " (no maximum limit)"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPriceRange([0, 10000]);
                          setPriceFromInput("0");
                          setPriceToInput("10000");
                          setIsPriceFilterActive(false);
                        }}
                        className="h-7 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 md:p-12 shadow-sm max-w-md">
              <div className="text-center space-y-4">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-500 text-base md:text-lg">{error}</p>
                <Button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory(undefined);
                    setSelectedSubCategory(undefined);
                    setPriceRange([0, 10000]);
                    setPriceFromInput("0");
                    setPriceToInput("10000");
                    setIsPriceFilterActive(false);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          </div>
        ) : loading ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="inline-block h-4 w-48 bg-muted animate-pulse rounded"></span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, idx) => (
                <Card key={idx} className="h-full flex flex-col shadow-sm">
                  {/* Image skeleton */}
                  <CardHeader className="p-3 md:p-4">
                    <div className="relative h-36 md:h-40 w-full bg-muted animate-pulse rounded"></div>
                  </CardHeader>
                  
                  {/* Content skeleton */}
                  <CardContent className="pt-3 md:pt-4 flex-1 flex flex-col px-3 md:px-6">
                    {/* Title */}
                    <div className="space-y-2 mb-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex gap-1.5 md:gap-2 mb-3">
                      <div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
                      <div className="h-5 w-20 bg-muted animate-pulse rounded-full"></div>
                    </div>
                    
                    {/* Price */}
                    <div className="h-6 bg-muted animate-pulse rounded w-20 mt-auto mb-2"></div>
                  </CardContent>
                  
                  {/* Button skeleton */}
                  <CardFooter className="pt-0 mt-auto px-3 md:px-6 pb-3 md:pb-6">
                    <div className="h-9 bg-muted animate-pulse rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 md:p-12 shadow-sm">
              <div className="text-center space-y-4">
                <svg className="mx-auto h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-muted-foreground text-base md:text-lg">No products found</p>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
              {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts}{" "}
              {totalProducts === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <Card 
                  key={product.stacklineSku} 
                  className="h-full hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col cursor-pointer group shadow-sm"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/product/${product.stacklineSku}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/product/${product.stacklineSku}`);
                    }
                  }}
                  aria-label={`View details for ${product.title}`}
                >
                  <CardHeader className="p-3 md:p-4">
                    <div className="relative h-36 md:h-40 w-full">
                      {product.imageUrls && product.imageUrls[0] ? (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <svg
                            className="h-12 md:h-16 w-12 md:w-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 md:pt-4 flex-1 flex flex-col px-3 md:px-6">
                    <CardTitle className="text-sm md:text-base line-clamp-2 mb-2 leading-tight">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="flex gap-1.5 md:gap-2 flex-wrap mb-3">
                      <Badge 
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedCategory(product.categoryName);
                          setCurrentPage(1);
                        }}
                      >
                        {product.categoryName}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedCategory(product.categoryName);
                          setSelectedSubCategory(product.subCategoryName);
                          setCurrentPage(1);
                        }}
                      >
                        {product.subCategoryName}
                      </Badge>
                    </CardDescription>
                    {product.retailPrice && (
                      <p className="text-base md:text-lg font-bold text-primary mt-auto mb-2">
                        ${product.retailPrice.toFixed(2)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 mt-auto px-3 md:px-6 pb-3 md:pb-6 gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInWishlist(product.stacklineSku)) {
                          removeFromWishlist(product.stacklineSku);
                        } else {
                          addToWishlist({
                            stacklineSku: product.stacklineSku,
                            title: product.title,
                            retailPrice: product.retailPrice,
                            imageUrl: product.imageUrls[0] || '',
                            categoryName: product.categoryName,
                            subCategoryName: product.subCategoryName,
                          });
                        }
                      }}
                      aria-label={isInWishlist(product.stacklineSku) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <svg
                        className={`h-4 w-4 ${isInWishlist(product.stacklineSku) ? 'fill-current' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </Button>
                    {product.retailPrice && (
                      <Button 
                        variant="default" 
                        className="flex-1 text-xs md:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            stacklineSku: product.stacklineSku,
                            title: product.title,
                            retailPrice: product.retailPrice!,
                            imageUrl: product.imageUrls[0] || '',
                            categoryName: product.categoryName,
                          });
                        }}
                      >
                        Add to Cart
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalProducts > productsPerPage && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-3 mt-6 md:mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto"
                  aria-label="Go to previous page"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <div className="flex gap-1 flex-wrap justify-center">
                  {Array.from(
                    { length: Math.ceil(totalProducts / productsPerPage) },
                    (_, i) => i + 1
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === Math.ceil(totalProducts / productsPerPage) ||
                        Math.abs(page - currentPage) <= 2
                    )
                    .map((page, idx, arr) => (
                      <Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 py-2 text-xs md:text-sm">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[36px] md:min-w-[40px] text-xs md:text-sm"
                          aria-label={`Go to page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </Button>
                      </Fragment>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(Math.ceil(totalProducts / productsPerPage), prev + 1)
                    )
                  }
                  disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
                  className="w-full sm:w-auto"
                  aria-label="Go to next page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <header className="border-b shadow-sm sticky top-0 bg-background z-10">
          <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <Link href="/">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity text-foreground dark:bg-gradient-to-r dark:from-primary dark:to-primary/60 dark:bg-clip-text dark:text-transparent">
                  StackShop
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                <WishlistIcon />
                <CartIcon />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          <p className="text-sm text-muted-foreground mb-4">
            <span className="inline-block h-4 w-48 bg-muted animate-pulse rounded"></span>
          </p>
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

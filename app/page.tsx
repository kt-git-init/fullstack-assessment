"use client";

import { useState, useEffect, Fragment } from "react";
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
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  retailPrice?: number;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((error) => {
        console.error('Failed to fetch categories:', error);
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
          console.error('Failed to fetch subcategories:', error);
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

      // When searching, search globally across all products (ignore category filters)
      if (search) {
        params.append("search", search);
        params.append("limit", "1000"); // Higher limit for search to cover full dataset
        params.append("offset", "0");
      } else {
        // When not searching, use category filters and pagination
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
          const normalizedProducts = data.products.map((product: Product) => ({
            ...product,
            imageUrls: product.imageUrls || [],
          }));
          setProducts(normalizedProducts);
          setTotalProducts(data.total);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch products:', error);
          if (error instanceof TypeError) {
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            setError(error.message || 'Failed to load products. Please try again.');
          }
          setLoading(false);
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, selectedCategory, selectedSubCategory, currentPage, productsPerPage]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-6">StackShop</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);
                  // Clear category filters when starting a search for global results
                  if (value) {
                    setSelectedCategory(undefined);
                    setSelectedSubCategory(undefined);
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
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => {
                setSearch("");
                setSelectedCategory(undefined);
                setSelectedSubCategory(undefined);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
              {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts}{" "}
              {totalProducts === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.stacklineSku} 
                  className="h-full hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
                  onClick={() => router.push(`/product/${product.stacklineSku}`)}
                >
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted flex items-center justify-center">
                      {product.imageUrls && product.imageUrls[0] ? (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          <svg
                            className="h-16 w-16"
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
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <CardTitle className="text-base line-clamp-2 mb-2">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="flex gap-2 flex-wrap">
                      <Badge 
                        variant="secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.categoryName}
                      </Badge>
                      <Badge 
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.subCategoryName}
                      </Badge>
                    </CardDescription>
                    {product.retailPrice && (
                      <p className="text-lg font-bold text-primary mt-auto">
                        ${product.retailPrice.toFixed(2)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 mt-auto">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/product/${product.stacklineSku}`);
                      }}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalProducts > productsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
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
                          <span className="px-3 py-2">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      </Fragment>
                    ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(Math.ceil(totalProducts / productsPerPage), prev + 1)
                    )
                  }
                  disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
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

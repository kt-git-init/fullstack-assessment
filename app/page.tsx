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
import { useRouter } from "next/navigation";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value || undefined)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select
                value={selectedSubCategory}
                onValueChange={(value) =>
                  setSelectedSubCategory(value || undefined)
                }
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
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
              {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.stacklineSku} 
                  className="h-full hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
                  onClick={() => router.push(`/product/${product.stacklineSku}`)}
                >
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                      {product.imageUrls[0] && (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
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
                  </CardContent>
                  <CardFooter>
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

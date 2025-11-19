'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  featureBullets: string[];
  retailerSku: string;
  retailPrice?: number;
}

export default function ProductPage() {
  const params = useParams();
  const sku = params.sku as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sku) {
      setError('No product specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedImage(0); // Reset to first image when SKU changes
    
    fetch(`/api/products/${sku}`)
      .then((res) => {
        if (res.status === 404) {
          throw new Error('Product not found. It may have been removed, or the link is incorrect.');
        }
        if (res.status >= 500) {
          throw new Error('Something went wrong while loading the product. Please try again.');
        }
        if (!res.ok) {
          throw new Error('Unable to load product. Please try again.');
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        // Network error or fetch failure
        if (err instanceof TypeError) {
          setError('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError(err.message);
        }
        setLoading(false);
      });
  }, [sku]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <Card className="p-8 md:p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">Loading product details...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <Card className="p-8 md:p-12 shadow-sm">
            <div className="text-center space-y-4">
              <svg className="mx-auto h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
                {error || 'Product not found'}
              </p>
              <Link href="/">
                <Button className="mt-4">
                  Browse Products
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <Link href="/">
          <Button variant="ghost" className="mb-4 hover:bg-accent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-4">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-8">
                <div className="relative h-64 md:h-80 lg:h-96 w-full">
                  {product.imageUrls && product.imageUrls[selectedImage] ? (
                    <Image
                      src={product.imageUrls[selectedImage]}
                      alt={product.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                      priority
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <svg
                        className="h-20 md:h-24 w-20 md:w-24 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm md:text-base">No image available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {product.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 md:h-20 border-2 rounded-lg overflow-hidden p-2 transition-all hover:scale-105 ${
                      selectedImage === idx 
                        ? 'border-primary ring-2 ring-primary ring-offset-2' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={url}
                        alt={`${product.title} - Image ${idx + 1}`}
                        fill
                        className="object-contain"
                        sizes="100px"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs md:text-sm">{product.categoryName}</Badge>
                  <Badge variant="outline" className="text-xs md:text-sm">{product.subCategoryName}</Badge>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 leading-tight">{product.title}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    SKU: <span className="font-mono">{product.retailerSku}</span>
                  </p>
                </div>
                {product.retailPrice && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                      ${product.retailPrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {product.featureBullets && product.featureBullets.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Key Features
                  </h2>
                  <ul className="space-y-3">
                    {product.featureBullets.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 group">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0 group-hover:scale-125 transition-transform" />
                        <span className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


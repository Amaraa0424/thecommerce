"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import {
  Heart,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  Share2,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useFavorites } from "@/contexts/favorites-context";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  const isWishlisted = isFavorite(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleToggleWishlist = () => {
    toggleFavorite(product);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square overflow-hidden rounded-lg border">
          <Image
            src={product.images[selectedImage] || "/placeholder.svg"}
            alt={product.title}
            width={600}
            height={600}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Thumbnail Images */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                  selectedImage === index
                    ? "border-primary"
                    : "border-muted hover:border-muted-foreground"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.title} ${index + 1}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Badge variant="outline" className="mb-2">
            {product.category}
          </Badge>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.subtitle && (
            <p className="text-xl text-muted-foreground mt-2">
              {product.subtitle}
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="font-medium">{product.rating}</span>
            <span className="text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold">${product.price}</span>
          {product.originalPrice && (
            <>
              <span className="text-xl text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
              <Badge variant="destructive">Save {discountPercentage}%</Badge>
            </>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              product.availability === "in-stock"
                ? "bg-green-500"
                : product.availability === "limited"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="font-medium">
            {product.availability === "in-stock"
              ? "In Stock"
              : product.availability === "limited"
              ? "Limited Stock"
              : "Out of Stock"}
          </span>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Quantity and Actions */}
        <div className="space-y-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 min-w-[3rem] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={product.availability === "out-of-stock"}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.availability === "out-of-stock"}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.availability === "out-of-stock"
                ? "Out of Stock"
                : "Add to Cart"}
            </Button>
            <Button size="lg" variant="outline" onClick={handleToggleWishlist}>
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted ? "fill-current text-red-500" : ""
                }`}
              />
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-sm text-muted-foreground">
                    On orders over $50
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Warranty</div>
                  <div className="text-sm text-muted-foreground">
                    1 year guarantee
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Easy Returns</div>
                  <div className="text-sm text-muted-foreground">
                    30-day policy
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

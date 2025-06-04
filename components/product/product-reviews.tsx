"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Star, ThumbsUp, ThumbsDown } from "lucide-react"
import { reviews } from "@/lib/data"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState("newest")

  const productReviews = reviews.filter((review) => review.productId === productId)

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = productReviews.filter((review) => review.rating === rating).length
    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0
    return { rating, count, percentage }
  })

  const averageRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {productReviews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Based on {productReviews.length} reviews</div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Progress value={percentage} className="flex-1" />
                      <span className="w-8 text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reviews ({productReviews.length})</h3>
                <Button variant="outline">Write a Review</Button>
              </div>

              <div className="space-y-6">
                {productReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {review.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{review.userName}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant="secondary">Verified Purchase</Badge>
                          </div>

                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-muted-foreground">{review.comment}</p>

                          <div className="flex items-center gap-4 pt-2">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Helpful (12)
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Not helpful (1)
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</div>
              <Button>Write the First Review</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

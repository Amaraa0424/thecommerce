"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { ReviewForm } from "./review-form"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface ProductReviewsProps {
  productId: string
  productTitle: string
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  userName: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ReviewData {
  reviews: Review[]
  ratingStats: {
    average: number
    total: number
    distribution: Array<{
      rating: number
      count: number
    }>
  }
  pagination: {
    total: number
    pages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: "10"
      })

      const response = await fetch(`/api/products/${productId}/reviews?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch reviews")
      }

      const data = await response.json()
      setReviewData(data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId, sortBy, sortOrder, currentPage])

  const handleReviewSubmitted = () => {
    // Refresh reviews after a new review is submitted
    fetchReviews()
  }

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-")
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!reviewData) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load reviews</p>
        </div>
      </div>
    )
  }

  const { reviews, ratingStats } = reviewData
  const hasReviews = reviews.length > 0

  // Calculate rating distribution percentages
  const ratingDistribution = ratingStats.distribution.map((item) => ({
    ...item,
    percentage: ratingStats.total > 0 ? (item.count / ratingStats.total) * 100 : 0
  }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {hasReviews ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{ratingStats.average.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(ratingStats.average) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Based on {ratingStats.total} reviews</div>
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h3 className="text-lg font-semibold">Reviews ({ratingStats.total})</h3>
                <div className="flex items-center gap-4">
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Newest first</SelectItem>
                      <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                      <SelectItem value="rating-desc">Highest rated</SelectItem>
                      <SelectItem value="rating-asc">Lowest rated</SelectItem>
                    </SelectContent>
                  </Select>
                  <ReviewForm 
                    productId={productId} 
                    productTitle={productTitle}
                    onReviewSubmitted={handleReviewSubmitted}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.user.image || ""} alt={review.user.name || ""} />
                          <AvatarFallback>
                            {(review.user.name || review.userName)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{review.user.name || review.userName}</div>
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
                              Helpful
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Not helpful
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {reviewData.pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!reviewData.pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {currentPage} of {reviewData.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!reviewData.pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</div>
              <ReviewForm 
                productId={productId} 
                productTitle={productTitle}
                onReviewSubmitted={handleReviewSubmitted}
                trigger={<Button>Write the First Review</Button>}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

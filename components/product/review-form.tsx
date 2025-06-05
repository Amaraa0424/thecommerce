"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useErrorHandler } from "@/lib/error-handler"

interface ReviewFormProps {
  productId: string
  productTitle: string
  onReviewSubmitted?: () => void
  trigger?: React.ReactNode
}

export function ReviewForm({ productId, productTitle, onReviewSubmitted, trigger }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const { handleError, showSuccess, handleAuthError, handleValidationError } = useErrorHandler()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      handleAuthError(null, {
        title: "Authentication Required",
        description: "Please sign in to write a review"
      })
      return
    }

    if (rating === 0) {
      handleValidationError(null, {
        title: "Rating Required",
        description: "Please select a rating"
      })
      return
    }

    if (comment.trim().length < 10) {
      handleValidationError(null, {
        title: "Review Too Short",
        description: "Please write at least 10 characters in your review"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      showSuccess("Review submitted successfully!", "Thank you for your feedback!")
      
      // Reset form
      setRating(0)
      setComment("")
      setIsOpen(false)
      
      // Notify parent component
      onReviewSubmitted?.()
    } catch (error) {
      handleError(error, {
        title: "Failed to submit review",
        description: "Unable to submit your review. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const displayRating = hoveredRating || rating

  const defaultTrigger = (
    <Button variant="outline">
      Write a Review
    </Button>
  )

  if (!isAuthenticated) {
    return (
      <Button 
        variant="outline" 
        onClick={() => handleAuthError(null, {
          title: "Authentication Required",
          description: "Please sign in to write a review"
        })}
      >
        Write a Review
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {productTitle}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 characters (minimum 10)
            </div>
          </div>

          {/* User Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">
                Reviewing as: <span className="font-medium text-foreground">{user?.name || "Anonymous"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
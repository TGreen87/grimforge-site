import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// Mock reviews for demo
const mockReviews: Review[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Alex M.",
    rating: 5,
    title: "Outstanding release",
    comment: "Raw yet atmospheric in the best way. Excellent songwriting and production — a standout black metal record.",
    date: "2024-01-15",
    helpful: 12,
    verified: true
  },
  {
    id: "2", 
    userId: "user2",
    userName: "Void Walker",
    rating: 4,
    title: "Solid addition to the collection",
    comment: "Great pressing quality on this vinyl. The artwork is stunning and the sound quality is excellent. Would recommend to any black metal enthusiast.",
    date: "2024-01-10",
    helpful: 8,
    verified: true
  },
  {
    id: "3",
    userId: "user3", 
    userName: "Jamie R.",
    rating: 5,
    title: "Haunting and powerful",
    comment: "From the first track to the last, it holds a consistent mood. The atmospheric elements are perfectly balanced with the heavier sections.",
    date: "2024-01-08",
    helpful: 15,
    verified: false
  }
];

const ProductReviews = ({ productId, averageRating = 4.8, totalReviews = 127 }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews] = useState(mockReviews);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", comment: "" });
  const [isWritingReview, setIsWritingReview] = useState(false);

  const handleSubmitReview = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to write a review.",
        variant: "destructive"
      });
      return;
    }

    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast({
        title: "Review Incomplete",
        description: "Please provide both a title and comment for your review.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Review Submitted",
      description: "Your review has been submitted and will appear after moderation.",
    });

    setNewReview({ rating: 5, title: "", comment: "" });
    setIsWritingReview(false);
  };

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`${size} ${i < rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const renderInteractiveStars = (rating: number, onChange: (rating: number) => void) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className="hover:scale-110 transition-transform"
      >
        <Star 
          className={`h-6 w-6 ${i < rating ? 'fill-accent text-accent' : 'text-muted-foreground hover:text-accent'}`} 
        />
      </button>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-card/30 p-6 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-accent mb-2">{averageRating}</div>
            <div className="flex justify-center gap-1 mb-2">
              {renderStars(Math.floor(averageRating), "h-5 w-5")}
            </div>
            <p className="text-muted-foreground">Based on {totalReviews} reviews</p>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = Math.floor(Math.random() * 50) + 10; // Mock data
              const percentage = (count / totalReviews) * 100;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{stars}★</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review */}
      <div className="bg-card/30 p-6 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Write a Review</h3>
          {!isWritingReview && (
            <Button onClick={() => setIsWritingReview(true)}>
              Write Review
            </Button>
          )}
        </div>

        {isWritingReview && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {renderInteractiveStars(newReview.rating, (rating) => 
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review Title</label>
              <input
                type="text"
                placeholder="Summarize your experience..."
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 bg-background border border-border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                placeholder="Share your thoughts about this product..."
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview}>
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setIsWritingReview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-card/30 p-6 rounded-lg border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-bone">
                    {review.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.userName}</span>
                    {review.verified && (
                      <Badge variant="outline" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            <h4 className="font-medium mb-2">{review.title}</h4>
            <p className="text-muted-foreground mb-4">{review.comment}</p>

            <div className="flex items-center gap-4 text-sm">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ThumbsUp className="h-4 w-4" />
                Helpful ({review.helpful})
              </button>
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ThumbsDown className="h-4 w-4" />
                Not helpful
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Users, Star, Image } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface FavoritedCreator {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  cover_image: string;
  bio: string;
  category: string;
  subscribers: number;
  verified: boolean;
  favorited_at: string;
}

export const Favorites: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/fan/${user.id}/favorites`);
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        const data = await response.json();
        setFavorites(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleUnfavorite = async (creatorId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/creators/${creatorId}/favorite`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.id !== creatorId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  return (
    <EdgeToEdgeContainer>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Your Favorites
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Keep track of creators you love and want to follow
            </p>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Main Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Error loading favorites: {error}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Start favoriting creators to keep track of ones you love
            </p>
            <Button variant="premium" asChild>
              <Link to="/explore">Discover Creators</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {favorites.length} favorited creator{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((creator) => (
                <Card key={creator.id} className="overflow-hidden bg-gradient-card border-border/50">
                  <div className="relative">
                    {creator.cover_image ? (
                      <img
                        src={creator.cover_image}
                        alt={creator.display_name}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 flex items-center justify-center ${creator.cover_image ? 'hidden' : ''}`}>
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="absolute -bottom-6 left-4">
                      <Avatar className="w-12 h-12 border-2 border-background">
                        <AvatarImage src={creator.avatar} alt={creator.username} />
                        <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    {creator.verified && (
                      <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground">
                      {creator.category}
                    </Badge>
                  </div>

                  <CardContent className="pt-8 pb-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{creator.display_name}</h3>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 leading-tight max-h-[2.4em] overflow-hidden">
                        {creator.bio}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {creator.subscribers.toLocaleString()} subscribers
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Favorited on {new Date(creator.favorited_at).toLocaleDateString()}
                      </p>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <Link to={`/creator/${creator.username}`}>
                            View Profile
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-destructive"
                          onClick={() => handleUnfavorite(creator.id)}
                        >
                          <Heart className="w-4 h-4 mr-2 fill-current" />
                          Remove from favorites
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </EdgeToEdgeContainer>
    </EdgeToEdgeContainer>
  );
};

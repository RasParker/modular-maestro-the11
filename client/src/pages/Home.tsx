import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Users, DollarSign, Crown, TrendingUp } from 'lucide-react';

// Mock featured creators data
const FEATURED_CREATORS = [
  {
    id: '1',
    username: 'artisticmia',
    display_name: 'Artistic Mia',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5fd?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop',
    bio: 'Digital artist creating stunning fantasy worlds',
    subscribers: 2840,
    verified: true,
    tiers: [
      { name: 'Supporter', price: 5 },
      { name: 'Fan', price: 15 },
      { name: 'Superfan', price: 25 }
    ]
  },
  {
    id: '2',
    username: 'fitnessking',
    display_name: 'Fitness King',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    bio: 'Personal trainer sharing workout tips and nutrition advice',
    subscribers: 5120,
    verified: true,
    tiers: [
      { name: 'Basic', price: 10 },
      { name: 'Premium', price: 20 }
    ]
  },
  {
    id: '3',
    username: 'musicmaker',
    display_name: 'Music Maker',
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop',
    bio: 'Producer creating exclusive beats and music tutorials',
    subscribers: 1890,
    verified: false,
    tiers: [
      { name: 'Listener', price: 8 },
      { name: 'Producer', price: 18 }
    ]
  }
];

const PLATFORM_STATS = [
  { label: 'Active Creators', value: '10,000+', icon: Crown },
  { label: 'Total Subscribers', value: '500K+', icon: Users },
  { label: 'Creator Earnings', value: '$2M+', icon: DollarSign },
  { label: 'Monthly Growth', value: '25%', icon: TrendingUp },
];

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Monetize Your{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Creativity
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join Xclusive, the premium platform where creators earn from exclusive content 
              and fans get closer to their favorite creators through paid subscriptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Button size="xl" variant="premium" asChild>
                    <Link to="/signup">Start Creating</Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link to="/explore">Explore Creators</Link>
                  </Button>
                </>
              ) : (
                <Button size="xl" variant="premium" asChild>
                  <Link to={user.role === 'creator' ? '/creator/dashboard' : '/explore'}>
                    {user.role === 'creator' ? 'Go to Dashboard' : 'Explore Creators'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {PLATFORM_STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Creators
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover amazing creators and their exclusive content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CREATORS.map((creator) => (
              <Card key={creator.id} className="overflow-hidden bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="relative">
                  <img 
                    src={creator.cover} 
                    alt={creator.display_name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute -bottom-6 left-4">
                    <Avatar className="w-12 h-12 border-2 border-background">
                      <AvatarImage src={creator.avatar} alt={creator.username} />
                      <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {creator.verified && (
                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <CardContent className="pt-8 pb-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{creator.display_name}</h3>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {creator.bio}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {creator.subscribers.toLocaleString()} subscribers
                    </div>
                    
                    {creator.tiers.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <span className="font-semibold text-accent">
                          ${creator.tiers[0].price}/month
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">No tiers available</span>
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/creator/${creator.username}`}>
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="premium" size="lg" asChild>
              <Link to="/explore">View All Creators</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of creators already earning from their passion
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="premium" asChild>
              <Link to="/signup">Become a Creator</Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/explore">Find Creators</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
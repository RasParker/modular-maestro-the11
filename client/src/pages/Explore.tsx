import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EdgeToEdgeContainer } from '@/components/layout/EdgeToEdgeContainer';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, Star, Filter, Heart, MessageSquare, Share2, Image, Video } from 'lucide-react';

// Mock creators data
const CREATORS = [
  {
    id: '1',
    username: 'artisticmia',
    display_name: 'Artistic Mia',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop',
    bio: 'Digital artist creating stunning fantasy worlds and character designs',
    category: 'Art',
    subscribers: 2840,
    verified: true,
    tiers: [
      { id: 'mock_1_1', name: 'Supporter', price: 5, description: 'Basic support tier', benefits: ['Access to exclusive posts', 'Monthly updates'] },
      { id: 'mock_1_2', name: 'Fan', price: 15, description: 'Fan tier with more benefits', benefits: ['Everything in Supporter', 'Direct messages', 'Weekly updates'] },
      { id: 'mock_1_3', name: 'Superfan', price: 25, description: 'Ultimate fan experience', benefits: ['Everything in Fan', 'Video calls', 'Custom content'] }
    ]
  },
  {
    id: '2',
    username: 'fitnessking',
    display_name: 'Fitness King',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    bio: 'Personal trainer sharing workout tips and nutrition advice',
    category: 'Fitness',
    subscribers: 5120,
    verified: true,
    tiers: [
      { id: 'mock_2_1', name: 'Basic', price: 10, description: 'Basic fitness plan', benefits: ['Weekly workout videos', 'Nutrition tips'] },
      { id: 'mock_2_2', name: 'Premium', price: 20, description: 'Premium fitness experience', benefits: ['Everything in Basic', 'Personal training sessions', 'Custom meal plans'] }
    ]
  },
  {
    id: '3',
    username: 'musicmaker',
    display_name: 'Music Maker',
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop',
    bio: 'Producer creating exclusive beats and music tutorials',
    category: 'Music',
    subscribers: 1890,
    verified: false,
    tiers: [
      { id: 'mock_3_1', name: 'Listener', price: 8, description: 'Music lover tier', benefits: ['Early access to new tracks', 'Behind the scenes content'] },
      { id: 'mock_3_2', name: 'Producer', price: 18, description: 'Producer collaboration tier', benefits: ['Everything in Listener', 'Beat making tutorials', 'Collaboration opportunities'] }
    ]
  },
  {
    id: '4',
    username: 'techguru',
    display_name: 'Tech Guru',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
    bio: 'Technology reviews and programming tutorials',
    category: 'Tech',
    subscribers: 3250,
    verified: true,
    tiers: [
      { id: 'mock_4_1', name: 'Follower', price: 7, description: 'Tech enthusiast tier', benefits: ['Weekly tech news', 'Product reviews'] },
      { id: 'mock_4_2', name: 'Student', price: 12, description: 'Learning focused tier', benefits: ['Everything in Follower', 'Programming tutorials', 'Code reviews'] },
      { id: 'mock_4_3', name: 'Pro', price: 25, description: 'Professional development tier', benefits: ['Everything in Student', 'One-on-one mentoring', 'Career guidance'] }
    ]
  },
  {
    id: '5',
    username: 'cookingstar',
    display_name: 'Cooking Star',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
    bio: 'Chef sharing exclusive recipes and cooking techniques',
    category: 'Cooking',
    subscribers: 2150,
    verified: true,
    tiers: [
      { id: 'mock_5_1', name: 'Foodie', price: 9, description: 'Food lover tier', benefits: ['Weekly recipes', 'Cooking tips'] },
      { id: 'mock_5_2', name: 'Chef', price: 19, description: 'Professional cooking tier', benefits: ['Everything in Foodie', 'Live cooking sessions', 'Professional techniques'] }
    ]
  },
  {
    id: '6',
    username: 'fashionista',
    display_name: 'Style Maven',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=200&fit=crop',
    bio: 'Fashion designer and style consultant',
    category: 'Fashion',
    subscribers: 1820,
    verified: false,
    tiers: [
      { id: 'mock_6_1', name: 'Trendy', price: 12, description: 'Fashion forward tier', benefits: ['Style guides', 'Trend reports'] },
      { id: 'mock_6_2', name: 'Stylish', price: 22, description: 'Personal styling tier', benefits: ['Everything in Trendy', 'Personal styling sessions', 'Wardrobe consultations'] }
    ]
  }
];

const CATEGORIES = ['All', 'Art', 'Fitness', 'Music', 'Tech', 'Cooking', 'Fashion'];

export const Explore: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tierSelectionModalOpen, setTierSelectionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  
  const [realCreators, setRealCreators] = useState<any[]>([]);
  const [allCreators, setAllCreators] = useState<any[]>([]);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const response = await fetch('/api/creators');
        if (response.ok) {
          const creators = await response.json();
          console.log('Fetched real creators:', creators);

          // Transform real creators to match the expected format
          // Filter out suspended users first
          const activeCreators = creators.filter((creator: any) => creator.status === 'active');
          
          const transformedCreators = await Promise.all(activeCreators.map(async (creator: any) => {
            // Fetch subscription tiers from API
            let tiers = [];
            try {
              const tiersResponse = await fetch(`/api/creators/${creator.id}/tiers`);
              if (tiersResponse.ok) {
                const tiersData = await tiersResponse.json();
                console.log(`Fetched tiers for creator ${creator.id} (${creator.username}):`, tiersData);
                tiers = tiersData.map((tier: any) => ({
                  id: tier.id,
                  name: tier.name,
                  price: tier.price, // Keep as string to preserve decimal precision
                  description: tier.description || '',
                  benefits: tier.benefits || [],
                  creator_id: tier.creator_id
                }));
                console.log(`Transformed tiers for creator ${creator.id}:`, tiers);
              }
            } catch (error) {
              console.error("Error fetching subscription tiers:", error);
              tiers = [];
            }

            return {
              id: `real_${creator.id}`,
              username: creator.username,
              display_name: creator.display_name || creator.username,
              avatar: creator.avatar || null,
              cover: creator.cover_image || null,
              bio: creator.bio || 'Creator profile - join for exclusive content!',
              category: 'General',
              subscribers: creator.total_subscribers || 0,
              verified: creator.verified || false,
              tiers: tiers
            };
          }));

          setRealCreators(transformedCreators);
          // Combine real creators with mock creators
          setAllCreators([...transformedCreators, ...CREATORS]);
        }
      } catch (error) {
        console.error('Error fetching creators:', error);
        // Fallback to mock creators only
        setAllCreators(CREATORS);
      }
    };

    fetchCreators();
  }, []);

  const handleSubscribe = async (creatorName: string, price: number) => {
    if (!user) {
      window.location.href = `/login?redirect=/explore`;
      return;
    }

    try {
      // Find the creator
      const creator = allCreators.find(c => c.display_name === creatorName);
      console.log(`Looking for creator with display_name: "${creatorName}"`);
      console.log(`Found creator:`, creator);
      console.log(`Creator tiers:`, creator?.tiers);
      
      if (!creator) {
        toast({
          title: "Error",
          description: "Creator not found.",
          variant: "destructive"
        });
        return;
      }

      // Check if user already has active subscription to this creator (only for real creators)
      if (creator.id.startsWith('real_')) {
        const subscriptionCheckResponse = await fetch(`/api/subscriptions/user/${user.id}/creator/${parseInt(creator.id.replace('real_', ''))}`);
        if (subscriptionCheckResponse.ok) {
          toast({
            title: "Already subscribed",
            description: `You already have an active subscription to ${creatorName}.`,
            variant: "destructive"
          });
          return;
        }
      }

      // Always open tier selection modal for consistent experience
      console.log(`Setting selectedCreator:`, creator);
      setSelectedCreator(creator);
      setTierSelectionModalOpen(true);
    } catch (error) {
      console.error('Subscription check error:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTierSelected = (tier: any) => {
    setSelectedTier(tier);
    setTierSelectionModalOpen(false);
    setPaymentModalOpen(true);
  };

  

  const filteredCreators = allCreators.filter(creator => {
    const matchesSearch = creator.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <EdgeToEdgeContainer>
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
        <EdgeToEdgeContainer maxWidth="7xl" enablePadding enableTopPadding>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Discover Amazing Creators
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find creators you love and support their exclusive content with subscriptions
            </p>
          </div>
        </EdgeToEdgeContainer>
      </div>

      {/* Main Content */}
      <EdgeToEdgeContainer maxWidth="7xl" enablePadding className="py-6 sm:py-8">

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-white text-black hover:bg-white/90' : 'hover:bg-[#1e1e24] hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0'}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => {
            return (
              <Card key={creator.id} className="overflow-hidden bg-gradient-card border-border/50">
                <div className="relative">
                  {creator.cover ? (
                    <img
                      src={creator.cover}
                      alt={creator.display_name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 flex items-center justify-center ${creator.cover ? 'hidden' : ''}`}>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Subscription tiers:</span>
                        <span className="text-sm font-medium">
                          {creator.tiers.length} option{creator.tiers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {creator.tiers.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">From</span>
                          <span className="font-semibold text-accent">
                            GHS {Math.min(...creator.tiers.map(t => t.price))}/month
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">No tiers available</span>
                        </div>
                      )}
                    </div>

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
                      {creator.tiers.length > 0 ? (
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribe(creator.display_name, Math.min(...creator.tiers.map(t => t.price)))}
                        >
                          Subscribe from GHS {Math.min(...creator.tiers.map(t => t.price))}/month
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          No subscription tiers available
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCreators.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find creators
            </p>
          </div>
        )}

      </EdgeToEdgeContainer>

      {/* Tier Selection Modal */}
      {selectedCreator && (
        <Dialog open={tierSelectionModalOpen} onOpenChange={setTierSelectionModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-gradient-to-br from-background to-background/95 backdrop-blur-xl border border-border/50">
            <DialogHeader className="flex-shrink-0 pb-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Join {selectedCreator.display_name}
              </DialogTitle>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                Choose your subscription tier and unlock exclusive content, direct access, and premium perks
              </p>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-4">
                {(() => {
                  console.log('Tier Selection Modal - selectedCreator:', selectedCreator);
                  console.log('Tier Selection Modal - selectedCreator.tiers:', selectedCreator.tiers);
                  return null;
                })()}
                {selectedCreator.tiers && selectedCreator.tiers.length > 0 ? (
                  selectedCreator.tiers.map((tier: any, index: number) => {
                    // Handle benefits properly - they might be a JSON string
                    let benefits = tier.benefits || [];
                    if (typeof benefits === 'string') {
                      try {
                        benefits = JSON.parse(benefits);
                      } catch (e) {
                        console.warn('Failed to parse benefits JSON:', e);
                        benefits = [];
                      }
                    }
                    if (!Array.isArray(benefits)) {
                      benefits = [];
                    }

                    const isPopular = index === 1 && selectedCreator.tiers.length > 2;

                    return (
                      <div
                        key={tier.id}
                        className={`relative p-6 border rounded-2xl cursor-pointer transition-all duration-300 group ${
                          isPopular 
                            ? 'border-primary/60 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg shadow-primary/10 scale-[1.02]' 
                            : 'border-border/30 hover:border-primary/40 bg-gradient-to-br from-card/50 to-background/50'
                        } hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]`}
                        onClick={() => handleTierSelected(tier)}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                              ⭐ Most Popular
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-5">
                          {/* Tier Header */}
                          <div className="text-center space-y-3">
                            <div className="space-y-2">
                              <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {tier.name}
                              </h4>
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-bold text-primary">
                                  GHS {typeof tier.price === 'string' ? parseFloat(tier.price).toFixed(0) : tier.price.toFixed(0)}
                                </span>
                                <span className="text-sm text-muted-foreground font-medium">/month</span>
                              </div>
                            </div>
                            
                            {/* Description */}
                            {tier.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                {tier.description}
                              </p>
                            )}
                          </div>

                          {/* Benefits */}
                          {benefits.length > 0 && (
                            <div className="space-y-4">
                              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                              <div className="space-y-3">
                                <h5 className="text-xs font-semibold text-primary uppercase tracking-wider text-center">
                                  What's Included
                                </h5>
                                <div className="grid gap-2.5">
                                  {benefits.slice(0, 4).map((benefit: string, index: number) => (
                                    <div key={index} className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                      <span className="text-sm text-foreground font-medium">{benefit}</span>
                                    </div>
                                  ))}
                                  {benefits.length > 4 && (
                                    <div className="flex items-center gap-3 opacity-75">
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold">+</span>
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {benefits.length - 4} more exclusive benefits
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2">
                            <div className={`w-full font-semibold py-4 px-6 rounded-xl text-center transition-all duration-300 ${
                              isPopular 
                                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30'
                                : 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:border-transparent'
                            } group-hover:scale-[1.02]`}>
                              <span className="flex items-center justify-center gap-2">
                                Select {tier.name}
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No Subscription Tiers</h3>
                    <p className="text-muted-foreground text-sm">This creator hasn't set up subscription tiers yet.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0 pt-6 border-t border-border/30">
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure payments via Paystack</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Modal */}
      {selectedTier && selectedCreator && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedTier(null);
            setSelectedCreator(null);
          }}
          tier={selectedTier}
          creatorName={selectedCreator.display_name}
        />
      )}
    </EdgeToEdgeContainer>
  );
};
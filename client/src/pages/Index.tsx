
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Users, 
  DollarSign, 
  Shield, 
  Smartphone, 
  ArrowRight 
} from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">X</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Xclusive
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Premium Creator Platform
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Monetize Your Content
            <br />
            Connect with Fans
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators earning from their content. Build your community, share exclusive content, and get paid for what you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80">
              <Link to="/signup">
                Start Creating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/explore">Explore Creators</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Choose Xclusive?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Monetize Content</CardTitle>
                <CardDescription>
                  Set up subscription tiers and earn recurring revenue from your loyal fans
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Build Community</CardTitle>
                <CardDescription>
                  Connect directly with your audience through exclusive content and messaging
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription>
                  Your content is protected with secure payment processing and privacy controls
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile Optimized CTA */}
      <section className="py-12 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Smartphone className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Perfect for Mobile
          </h2>
          <p className="text-muted-foreground mb-8">
            Access your creator dashboard, chat with fans, and manage your content from anywhere.
          </p>
          <div className="space-y-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/signup">Get Started Today</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-background">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-primary/80 rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">X</span>
              </div>
              <span className="font-semibold">Xclusive</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-primary">About</Link>
              <Link to="/explore" className="hover:text-primary">Explore</Link>
              <Link to="/login" className="hover:text-primary">Login</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            © 2024 Xclusive. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

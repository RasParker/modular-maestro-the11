
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Crown, User, Palette, Dumbbell, Music, Laptop, ChefHat, Shirt, Gamepad2, Briefcase, Home, GraduationCap, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Category } from '@shared/schema';

// Icon mapping for categories
const categoryIcons: { [key: string]: any } = {
  'Palette': Palette,
  'Dumbbell': Dumbbell,
  'Music': Music,
  'Laptop': Laptop,
  'ChefHat': ChefHat,
  'Shirt': Shirt,
  'Gamepad2': Gamepad2,
  'Briefcase': Briefcase,
  'Home': Home,
  'GraduationCap': GraduationCap,
};

type SignupStep = 'account' | 'categories';

export const Signup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'fan' | 'creator'>('fan');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<number | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch categories when moving to categories step
  useEffect(() => {
    const fetchCategories = async () => {
      if (currentStep === 'categories' && role === 'creator') {
        setLoadingCategories(true);
        try {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            setCategories(data);
          } else {
            console.error('Failed to fetch categories');
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();
  }, [currentStep, role]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // If removing the primary category, reset it
      if (isSelected && primaryCategory === categoryId) {
        setPrimaryCategory(null);
      }
      
      // Auto-set as primary if it's the first selection
      if (!isSelected && newSelection.length === 1) {
        setPrimaryCategory(categoryId);
      }
      
      return newSelection;
    });
  };

  const handleAccountStepNext = () => {
    if (!email || !username || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (role === 'creator') {
      setCurrentStep('categories');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Validate category selection for creators
    if (role === 'creator' && currentStep === 'categories') {
      if (selectedCategories.length === 0 && !customCategory) {
        toast({
          title: "Category required",
          description: "Please select at least one category or add a custom category.",
          variant: "destructive",
        });
        return;
      }
      
      if (!primaryCategory && selectedCategories.length > 0) {
        toast({
          title: "Primary category required",
          description: "Please select a primary category for your creator profile.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Handle custom category creation first if provided
      let finalPrimaryCategory = primaryCategory;
      if (customCategory && role === 'creator') {
        try {
          const categoryResponse = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: customCategory,
              slug: customCategory.toLowerCase().replace(/\s+/g, '-'),
              description: `Custom category: ${customCategory}`,
              icon: 'User',
              color: '#6366f1',
              is_active: true
            })
          });

          if (categoryResponse.ok) {
            const newCategory = await categoryResponse.json();
            finalPrimaryCategory = newCategory.id;
          }
        } catch (error) {
          console.error('Failed to create custom category:', error);
        }
      }

      await signup(email, password, username, role, finalPrimaryCategory || undefined);
      toast({
        title: "Welcome to Xclusive!",
        description: `Your ${role} account has been created successfully.`,
      });
      
      // Redirect based on role
      const redirectPath = role === 'creator' ? '/creator/dashboard' : '/fan/dashboard';
      navigate(redirectPath);
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = "Something went wrong";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes("Email already exists")) {
        errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
      } else if (errorMessage.includes("Username already exists")) {
        errorMessage = "This username is already taken. Please choose a different username.";
      } else if (errorMessage.includes("Failed to create user account")) {
        errorMessage = "Unable to create your account. Please try again or contact support.";
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressIndicator = () => {
    if (role !== 'creator') return null;
    
    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className={`w-3 h-3 rounded-full transition-colors ${
          currentStep === 'account' ? 'bg-primary' : 'bg-primary'
        }`}>
          {currentStep !== 'account' && <Check className="w-3 h-3 text-white" />}
        </div>
        <div className={`w-8 h-0.5 transition-colors ${
          currentStep === 'categories' ? 'bg-primary' : 'bg-muted'
        }`} />
        <div className={`w-3 h-3 rounded-full transition-colors ${
          currentStep === 'categories' ? 'bg-primary' : 'bg-muted'
        }`} />
      </div>
    );
  };

  const renderAccountStep = () => (
    <div className="space-y-4">
      {/* Role Selection */}
      <div className="space-y-3">
        <Label>I want to join as:</Label>
        <RadioGroup value={role} onValueChange={(value) => setRole(value as 'fan' | 'creator')}>
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="fan" id="fan" />
            <Label htmlFor="fan" className="flex items-center space-x-2 cursor-pointer flex-1">
              <User className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">Fan</div>
                <div className="text-xs text-muted-foreground">Support and follow creators</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="creator" id="creator" />
            <Label htmlFor="creator" className="flex items-center space-x-2 cursor-pointer flex-1">
              <Crown className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">Creator</div>
                <div className="text-xs text-muted-foreground">Monetize your content</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button 
        type="button" 
        className="w-full" 
        onClick={handleAccountStepNext}
        disabled={isLoading}
      >
        {role === 'creator' ? (
          <>
            Next: Choose Categories
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </div>
  );

  const renderCategoryStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Content Categories</h3>
        <p className="text-sm text-muted-foreground">
          Select categories that best describe your content. This helps fans discover you.
        </p>
      </div>

      {loadingCategories ? (
        <div className="grid grid-cols-1 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3" data-testid="category-selection">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.icon] || User;
              const isSelected = selectedCategories.includes(category.id);
              const isPrimary = primaryCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.id)}
                  data-testid={`category-${category.slug}`}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent 
                      className="w-5 h-5 mt-0.5" 
                      style={{ color: category.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {isPrimary && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-xs"
                      data-testid={`primary-badge-${category.slug}`}
                    >
                      Primary
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Category Option */}
          <div className="p-4 rounded-lg border-2 border-dashed border-border">
            <Label htmlFor="customCategory" className="font-medium">
              Don't see your category? Add a custom one:
            </Label>
            <Input
              id="customCategory"
              type="text"
              placeholder="Enter your custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-2"
            />
          </div>
          
          {selectedCategories.length > 1 && (
            <div className="space-y-3">
              <Label>Select Your Primary Category</Label>
              <p className="text-sm text-muted-foreground">
                Choose your main category. This will be displayed prominently on your profile.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {categories
                  .filter(cat => selectedCategories.includes(cat.id))
                  .map((category) => {
                    const IconComponent = categoryIcons[category.icon] || User;
                    const isPrimary = primaryCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setPrimaryCategory(category.id)}
                        data-testid={`primary-category-${category.slug}`}
                        className={`
                          p-3 rounded-lg border transition-all duration-200 text-left
                          ${isPrimary 
                            ? 'border-primary bg-primary/20' 
                            : 'border-border hover:border-border/80 hover:bg-muted/50'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setCurrentStep('account')}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">X</span>
            </div>
            <span className="text-2xl font-bold text-gradient-primary">
              Xclusive
            </span>
          </Link>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {currentStep === 'account' ? 'Join Xclusive' : 'Choose Your Categories'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'account' 
                ? 'Create your account and start your journey'
                : 'Help fans discover your content by selecting relevant categories'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderProgressIndicator()}
            {currentStep === 'account' ? renderAccountStep() : renderCategoryStep()}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-500 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

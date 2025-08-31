
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
import { Eye, EyeOff, Crown, User, Palette, Dumbbell, Music, Laptop, ChefHat, Shirt, Gamepad2, Briefcase, Home, GraduationCap, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
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

export const Signup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'fan' | 'creator'>('fan');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<number | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = role === 'creator' ? 3 : 2;

  // Fetch categories when role changes to creator
  useEffect(() => {
    const fetchCategories = async () => {
      if (role === 'creator') {
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
      } else {
        setSelectedCategories([]);
        setPrimaryCategory(null);
        setCategories([]);
        setCustomCategory('');
        setCustomCategoryDescription('');
      }
    };

    fetchCategories();
  }, [role]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      if (isSelected && primaryCategory === categoryId) {
        setPrimaryCategory(null);
      }
      
      if (!isSelected && newSelection.length === 1) {
        setPrimaryCategory(categoryId);
      }
      
      return newSelection;
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate basic info
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
    }

    if (currentStep === 2 && role === 'creator') {
      // Validate category selection
      if (selectedCategories.length === 0 && !customCategory.trim()) {
        toast({
          title: "Category required",
          description: "Please select at least one category or create a custom category.",
          variant: "destructive",
        });
        return;
      }

      if (!primaryCategory && !customCategory.trim()) {
        toast({
          title: "Primary category required",
          description: "Please select a primary category or create a custom category.",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalPrimaryCategory = primaryCategory;

      // If custom category is provided, create it first
      if (customCategory.trim()) {
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: customCategory.trim(),
              slug: customCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              description: customCategoryDescription.trim() || `${customCategory} category`,
              icon: 'User',
              color: '#6366f1',
            }),
          });

          if (response.ok) {
            const newCategory = await response.json();
            finalPrimaryCategory = newCategory.id;
          } else {
            throw new Error('Failed to create custom category');
          }
        } catch (error) {
          console.error('Error creating custom category:', error);
          toast({
            title: "Category creation failed",
            description: "Failed to create custom category. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      await signup(email, password, username, role, finalPrimaryCategory || undefined);
      toast({
        title: "Welcome to Xclusive!",
        description: `Your ${role} account has been created successfully.`,
      });
      
      const redirectPath = role === 'creator' ? '/creator/dashboard' : '/fan/dashboard';
      navigate(redirectPath);
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = "Something went wrong";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
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

  const renderProgressIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                i + 1 <= currentStep
                  ? 'bg-primary'
                  : i + 1 === currentStep + 1
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
            {i < totalSteps - 1 && (
              <div
                className={`w-8 h-0.5 transition-colors ${
                  i + 1 < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
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
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (role === 'fan') {
      return (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Almost done!</h3>
            <p className="text-muted-foreground">
              You're all set to start discovering amazing creators and exclusive content.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Choose Your Content Categories</h3>
          <p className="text-sm text-muted-foreground">
            Select the categories that best describe your content. This helps fans discover you!
          </p>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="category-selection">
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
                    relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105
                    ${isSelected 
                      ? 'border-primary bg-primary/10 shadow-md' 
                      : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: category.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{category.name}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {category.description || `Create and share ${category.name.toLowerCase()} content`}
                      </div>
                    </div>
                  </div>
                  {isPrimary && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs px-2 py-1 bg-primary text-primary-foreground"
                      data-testid={`primary-badge-${category.slug}`}
                    >
                      Primary
                    </Badge>
                  )}
                </button>
              );
            })}

            {/* Custom Category Option */}
            <div className={`
              relative p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${customCategory.trim() 
                ? 'border-primary bg-primary/10' 
                : 'border-dashed border-border hover:border-border/80 hover:bg-muted/50'
              }
            `}>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor="customCategory" className="text-sm font-medium">Other Category</Label>
                    <Input
                      id="customCategory"
                      placeholder="Enter custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {customCategory.trim() && (
                    <div>
                      <Label htmlFor="customCategoryDescription" className="text-sm">Description (optional)</Label>
                      <Textarea
                        id="customCategoryDescription"
                        placeholder="Describe your content category..."
                        value={customCategoryDescription}
                        onChange={(e) => setCustomCategoryDescription(e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedCategories.length > 1 && (
          <div className="space-y-3">
            <div className="text-center">
              <Label className="text-sm font-medium">Select Your Primary Category</Label>
              <p className="text-xs text-muted-foreground mt-1">
                This will be displayed prominently on your profile
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                          ? 'border-primary bg-primary/20 shadow-sm' 
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
    );
  };

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
        <Crown className="w-8 h-8 text-primary-foreground" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Ready to Create!</h3>
        <p className="text-muted-foreground mb-4">
          Your creator profile is almost ready. You can start creating content and building your audience.
        </p>
        <div className="p-4 rounded-lg bg-muted/20 space-y-2">
          <div className="text-sm font-medium">Your Profile Summary:</div>
          <div className="text-sm text-muted-foreground">
            <div>Username: @{username}</div>
            <div>Role: Creator</div>
            <div>
              Primary Category: {
                customCategory.trim() 
                  ? customCategory 
                  : categories.find(c => c.id === primaryCategory)?.name
              }
            </div>
            {selectedCategories.length > 0 && (
              <div>Additional Categories: {selectedCategories.length}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
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
            <CardTitle className="text-2xl">Join Xclusive</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's start with your basic information"}
              {currentStep === 2 && role === 'creator' && "Choose your content categories"}
              {currentStep === 2 && role === 'fan' && "Almost done!"}
              {currentStep === 3 && "Complete your creator profile"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderProgressIndicator()}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between pt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <div className="ml-auto">
                  {currentStep < totalSteps ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  )}
                </div>
              </div>
            </form>

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

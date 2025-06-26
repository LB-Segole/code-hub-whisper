
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ArrowLeft, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentTemplates } from '@/hooks/useAgentTemplates';
import { AgentTemplateCard } from '@/components/Marketplace/AgentTemplateCard';
import { useToast } from '@/hooks/use-toast';

const Marketplace = () => {
  const navigate = useNavigate();
  const { templates, categories, isLoading, error, refetch } = useAgentTemplates();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.downloads_count || 0) - (a.downloads_count || 0);
        case 'rating':
          return b.rating_average - a.rating_average;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleInstallTemplate = (template: any) => {
    // Navigate to assistants page with template data
    navigate('/assistants', { 
      state: { 
        templateData: template.template_data,
        templateName: template.name,
        templateId: template.id
      } 
    });
    
    toast({
      title: "Template Selected",
      description: `You can now create an assistant using the "${template.name}" template.`,
    });
  };

  const handlePreviewTemplate = (template: any) => {
    // TODO: Implement template preview modal
    console.log('Preview template:', template);
    toast({
      title: "Preview Coming Soon",
      description: "Template preview functionality will be available soon.",
    });
  };

  const handleRateTemplate = (template: any) => {
    // TODO: Implement template rating
    console.log('Rate template:', template);
    toast({
      title: "Rating Coming Soon",
      description: "Template rating functionality will be available soon.",
    });
  };

  const handleRetry = async () => {
    await refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
                  <p className="text-gray-600 mt-1">Discover and use pre-built AI agent templates</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div className="text-lg font-semibold text-gray-900">Failed to Load Templates</div>
              <div className="text-gray-600 max-w-md mx-auto">
                {error}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/assistants')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
                  <p className="text-gray-600 mt-1">Discover and use pre-built AI agent templates</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <div className="text-gray-500">Loading marketplace...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
                <p className="text-gray-600 mt-1">Discover and use pre-built AI agent templates</p>
              </div>
            </div>
            <Button onClick={() => navigate('/assistants')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Agent
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTemplates.length} of {templates.length} templates
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <div className="flex items-center space-x-4">
              <span>{categories.length} categories available</span>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No templates match your search criteria'
                  : 'No templates available yet'
                }
              </div>
              {(searchQuery || selectedCategory !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <AgentTemplateCard
                key={template.id}
                template={{
                  ...template,
                  description: template.description || 'No description available'
                }}
                onInstall={handleInstallTemplate}
                onPreview={handlePreviewTemplate}
                onFavorite={handleRateTemplate}
              />
            ))}
          </div>
        )}

        {/* Categories Overview */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const categoryCount = templates.filter(t => t.category === category).length;
                return (
                  <Card 
                    key={category} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{categoryCount} templates</Badge>
                        <Button variant="ghost" size="sm">
                          Explore →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

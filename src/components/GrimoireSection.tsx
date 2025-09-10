import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
const grimoire1 = "/assets/grimoire-1.jpg";
const grimoire2 = "/assets/grimoire-2.jpg";
const grimoire3 = "/assets/grimoire-3.jpg";

const GrimoireSection = () => {
  // Mock blog posts data
  const posts = [
    {
      id: 2,
      title: "Underground Tape Trading: The Lost Art",
      excerpt: "Before digital streaming, the underground thrived through tape trading networks that spread independent sounds...",
      author: "Cassette Archive",
      date: "2024-01-12",
      readTime: "6 min read",
      image: grimoire2,
      tags: ["Tapes", "History", "Underground"]
    },
    {
      id: 3,
      title: "Limited Edition Vinyl: Investment or Obsession?",
      excerpt: "Vinyl collecting has reached new heights. Are limited pressings worth the price?",
      author: "Vinyl Collector",
      date: "2024-01-10",
      readTime: "5 min read",
      image: grimoire3,
      tags: ["Vinyl", "Collecting", "Limited Edition"]
    }
  ];

  return (
    <section id="grimoire" className="py-20 px-4 bg-secondary/20">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="blackletter text-4xl md:text-6xl mb-4 text-bone">
            Journal
          </h2>
          <div className="w-24 h-1 blood-accent mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stories and interviews from the underground black metal community.
          </p>
        </div>

        {/* Featured Post */}
        <div className="mb-12">
          <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={posts[0].image} 
                  alt={posts[0].title}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  {posts[0].tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-frost text-frost">
                      {tag}
                    </Badge>
                  ))}
                  <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                </div>
                
                <h3 className="gothic-heading text-2xl md:text-3xl mb-4 text-bone">
                  {posts[0].title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {posts[0].excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{posts[0].author}</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{posts[0].readTime}</span>
                  </div>
                  
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => {
                      // Navigate to blog post
                      alert('Feature coming soon: Full blog post functionality');
                    }}
                  >
                    Read more
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {posts.slice(1).length > 0 ? posts.slice(1).map((post) => (
            <Card key={post.id} className="bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 group">
              <CardHeader className="p-0">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t"
                />
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-frost text-frost text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="gothic-heading text-xl mb-3 text-bone group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span className="mr-3">{post.author}</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{post.readTime}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-accent hover:text-accent"
                    onClick={() => {
                      // Navigate to blog post
                      alert('Feature coming soon: Full blog post functionality');
                    }}
                  >
                    Read more
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center text-muted-foreground">
              <p>More articles coming soon...</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="border-frost text-frost hover:bg-frost hover:text-background gothic-heading"
            onClick={() => {
              // Navigate to full journal section
              alert('Feature coming soon: Full journal section with all blog posts');
            }}
          >
            Read all articles
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GrimoireSection;
"use client"

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User } from "lucide-react";

export interface ArticlePreview {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  tags?: string[] | null;
}

interface GrimoireSectionProps {
  articles: ArticlePreview[];
}

const fallbackCopy = {
  heading: "Journal",
  blurb: "Editorial features return once the next wave of releases is ready.",
};

export default function GrimoireSection({ articles }: GrimoireSectionProps) {
  const sorted = [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });

  const [featured, ...rest] = sorted;
  const secondary = rest.slice(0, 2);

  if (!featured) {
    return (
      <section id="grimoire" className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto text-center">
          <h2 className="blackletter text-4xl md:text-6xl mb-4 text-bone">{fallbackCopy.heading}</h2>
          <div className="w-24 h-1 blood-accent mx-auto mb-6" aria-hidden="true" />
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {fallbackCopy.blurb}
          </p>
        </div>
      </section>
    );
  }

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value));
    } catch (_error) {
      return null;
    }
  };

  const renderMeta = (article: ArticlePreview) => {
    const date = formatDate(article.publishedAt);
    if (!article.author && !date) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {article.author ? (
          <span className="inline-flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            {article.author}
          </span>
        ) : null}
        {date ? (
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <section id="grimoire" className="bg-secondary/20 py-20 px-4">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 className="blackletter text-4xl text-bone md:text-6xl">Journal</h2>
          <div className="blood-accent mx-auto mb-6 h-1 w-24" aria-hidden="true" />
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Field notes, interviews, and release recaps from the Obsidian Rite vault.
          </p>
        </div>

        <Card className="mb-12 overflow-hidden border-border bg-card/80 backdrop-blur-sm md:flex">
          {featured.imageUrl ? (
            <div className="md:w-1/2">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="h-64 w-full object-cover md:h-full"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className={featured.imageUrl ? "md:w-1/2" : "w-full"}>
            <CardHeader className="p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="border-frost text-xs uppercase tracking-[0.3em] text-frost">
                  Feature
                </Badge>
                {featured.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border/60 text-xs text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
              <CardTitle className="gothic-heading mb-4 text-2xl text-bone md:text-3xl">
                {featured.title}
              </CardTitle>
              <p className="mb-6 text-sm text-muted-foreground md:text-base">
                {featured.excerpt || "Read the latest update from the label archives."}
              </p>
              {renderMeta(featured)}
            </CardHeader>
            <CardFooter className="flex justify-end gap-2 border-t border-border/60 bg-background/40 p-6">
              <Link
                href={`/articles/${featured.slug}`}
                className="inline-flex items-center gap-2 rounded-md border border-frost px-4 py-2 text-sm font-medium text-frost transition-colors hover:bg-frost hover:text-background"
              >
                Read article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardFooter>
          </div>
        </Card>

        {secondary.length > 0 ? (
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {secondary.map((article) => (
              <Card key={article.id} className="group border-border bg-card/80 transition-colors hover:border-accent">
                {article.imageUrl ? (
                  <CardHeader className="p-0">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-48 w-full rounded-t object-cover"
                      loading="lazy"
                    />
                  </CardHeader>
                ) : null}
                <CardContent className="p-6">
                  <CardTitle className="gothic-heading mb-3 text-xl text-bone group-hover:text-accent">
                    {article.title}
                  </CardTitle>
                  <p className="mb-5 text-sm text-muted-foreground">
                    {article.excerpt || "Latest dispatch from the label."}
                  </p>
                  {renderMeta(article)}
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}

        <div className="text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 rounded-md border border-frost px-5 py-3 text-sm font-medium text-frost transition-colors hover:bg-frost hover:text-background"
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

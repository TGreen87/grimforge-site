-- Set published_at automatically when an article is published
create or replace function public.set_published_at()
returns trigger as $$
begin
  if new.published = true and (old.published is distinct from new.published) then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_published_at on public.articles;
create trigger trg_articles_published_at
before update on public.articles
for each row execute function public.set_published_at();


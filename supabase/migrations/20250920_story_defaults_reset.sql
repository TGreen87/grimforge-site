-- Ensure storytelling surfaces have empty defaults until real content is curated
alter table public.story_newsletter_settings
  alter column heading set default ''::text,
  alter column subheading set default ''::text,
  alter column cta_label set default ''::text;

update public.story_newsletter_settings
set heading = '',
    subheading = '',
    cta_label = ''
where heading in ('Join the midnight mailing list', 'Join the midnight mailing list ')
   or subheading ilike '%monthly rituals%'
   or cta_label = 'Subscribe';

-- Remove any seeded timeline entries from earlier migrations
delete from public.story_timeline
where title in (
  'Ritual Beginnings',
  'Into the Underground',
  'Global Distribution',
  'Campaign Era'
);

-- Remove any seeded testimonials from earlier migrations
delete from public.story_testimonials
where quote in (
  'The only label that ships faster than the blast beats they promote.',
  'Packaging is immaculate, pressings are pristine, and every parcel smells like bonfire smoke.',
  'Obsidian Rite championed our debut when bigger labels wouldn’t return email.'
);

-- Remove placeholder storytelling content seeded previously
delete from public.story_timeline
where year in ('2015','2017','2020','2024')
  and title in ('Ritual Beginnings','Into the Underground','Global Distribution','Campaign Era');

delete from public.story_testimonials
where quote in (
  'The only label that ships faster than the blast beats they promote.',
  'Packaging is immaculate, pressings are pristine, and every parcel smells like bonfire smoke.',
  'Obsidian Rite championed our debut when bigger labels wouldn’t return email.'
);

update public.story_newsletter_settings
set heading = '',
    subheading = '',
    cta_label = '';

export const brand = {
  name: "Grimforge",
  shortName: "Grimforge",
  tagline: "Dark Music for Dark Souls",
  domain: "grimforge.com",
  socials: {
    instagram: "https://www.instagram.com/obsidianriterecords?igsh=MTgxNDZwbG5hY2VtOQ%3D%3D&utm_source=qr",
    facebook: "https://facebook.com/obsidianriterecords"
  }
} as const;

export type Brand = typeof brand;

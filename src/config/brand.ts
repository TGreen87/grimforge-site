export const brand = {
  name: "Obsidian Rite Records",
  shortName: "Obsidian Rite",
  tagline: "Dark Music for Dark Souls",
  domain: "obsidianriterecords.com",
  socials: {
    instagram: "https://www.instagram.com/obsidianriterecords?igsh=MTgxNDZwbG5hY2VtOQ%3D%3D&utm_source=qr",
    facebook: "https://facebook.com/obsidianriterecords",
    twitter: "https://twitter.com/obsidianriterecords"
  }
} as const;

export type Brand = typeof brand;

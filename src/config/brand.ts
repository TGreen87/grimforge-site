export const brand = {
  name: "Obsidian Rite Records",
  shortName: "Obsidian Rite",
  tagline: "Dark Music for Dark Souls",
  domain: "obsidianriterecords.com",
  socials: {
    instagram: "https://instagram.com/obsidianriterecords",
    facebook: "https://facebook.com/obsidianriterecords",
    twitter: "https://twitter.com/obsidianriterecords"
  }
} as const;

export type Brand = typeof brand;

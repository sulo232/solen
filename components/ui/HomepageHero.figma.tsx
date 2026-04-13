import figma from "@figma/code-connect";
import HomepageHero from "./HomepageHero";

// HomepageHero from Solen DESIGN file
// File: cInKwtgkD8TjUSSLDT40eF · Page: Components · Section: /de/ (components)
// Animation spec: 🎬 Animation Specs · Card/HomepageHero (id=34:7)
figma.connect(
  HomepageHero,
  "https://www.figma.com/design/cInKwtgkD8TjUSSLDT40eF/Solen-DESIGN",
  {
    example: () => (
      <HomepageHero
        categoryCounts={{}}
        reviewCount={2400}
      />
    ),
  }
);

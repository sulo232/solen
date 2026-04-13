import figma from "@figma/code-connect";
import FeaturedSalonCarousel from "./FeaturedSalonCarousel";

// Salon Card component set from Solen DESIGN file
// File: cInKwtgkD8TjUSSLDT40eF · Page: Components · Section: /de/ (components)
figma.connect(
  FeaturedSalonCarousel,
  "https://www.figma.com/design/cInKwtgkD8TjUSSLDT40eF/Solen-DESIGN",
  {
    example: () => (
      <FeaturedSalonCarousel
        salons={[]}
        locale="de"
        title="Coiffeur"
        viewAllHref="/de/coiffeur"
      />
    ),
  }
);

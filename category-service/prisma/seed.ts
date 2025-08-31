import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  // Home Services
  {
    name: "Plumbing",
    description:
      "All plumbing services including repairs, installations, and maintenance",
    children: [
      { name: "Pipe Repair", description: "Fix leaking and damaged pipes" },
      {
        name: "Pipe Installation",
        description: "Install new plumbing systems",
      },
      {
        name: "Drain Cleaning",
        description: "Clean blocked drains and sewers",
      },
      {
        name: "Water Heater Service",
        description: "Water heater repair and installation",
      },
    ],
  },
  {
    name: "Electrical",
    description: "Electrical services and installations",
    children: [
      { name: "Wiring", description: "Electrical wiring and rewiring" },
      {
        name: "Lighting Installation",
        description: "Install lights and fixtures",
      },
      {
        name: "Panel Upgrades",
        description: "Electrical panel upgrades and repairs",
      },
      {
        name: "Appliance Installation",
        description: "Install electrical appliances",
      },
    ],
  },
  {
    name: "Carpentry",
    description: "Woodworking and carpentry services",
    children: [
      { name: "Furniture Repair", description: "Repair and restore furniture" },
      {
        name: "Custom Furniture",
        description: "Build custom furniture pieces",
      },
      { name: "Deck Building", description: "Build and repair decks" },
      {
        name: "Cabinet Installation",
        description: "Install kitchen and bathroom cabinets",
      },
    ],
  },
  {
    name: "Painting",
    description: "Interior and exterior painting services",
    children: [
      {
        name: "Interior Painting",
        description: "Paint interior walls and ceilings",
      },
      { name: "Exterior Painting", description: "Paint building exteriors" },
      {
        name: "Wallpaper Installation",
        description: "Install and remove wallpaper",
      },
      {
        name: "Pressure Washing",
        description: "Clean surfaces before painting",
      },
    ],
  },

  // Technology Services
  {
    name: "Technology",
    description: "Computer and technology services",
    children: [
      { name: "Computer Repair", description: "Fix computers and laptops" },
      { name: "Network Setup", description: "Set up home and office networks" },
      {
        name: "Software Installation",
        description: "Install and configure software",
      },
      { name: "Data Recovery", description: "Recover lost or corrupted data" },
    ],
  },

  // Cleaning Services
  {
    name: "Cleaning",
    description: "Professional cleaning services",
    children: [
      { name: "House Cleaning", description: "Regular home cleaning services" },
      { name: "Deep Cleaning", description: "Thorough deep cleaning services" },
      { name: "Carpet Cleaning", description: "Professional carpet cleaning" },
      {
        name: "Window Cleaning",
        description: "Interior and exterior window cleaning",
      },
    ],
  },

  // Garden & Landscaping
  {
    name: "Landscaping",
    description: "Garden and outdoor maintenance services",
    children: [
      {
        name: "Lawn Mowing",
        description: "Regular lawn cutting and maintenance",
      },
      { name: "Garden Design", description: "Design and plan garden layouts" },
      {
        name: "Tree Services",
        description: "Tree trimming, removal, and care",
      },
      {
        name: "Irrigation Systems",
        description: "Install and maintain irrigation",
      },
    ],
  },

  // Personal Care
  {
    name: "Personal Care",
    description: "Personal care and wellness services",
    children: [
      {
        name: "Elderly Care",
        description: "Care services for elderly individuals",
      },
      { name: "Childcare", description: "Babysitting and childcare services" },
      { name: "Pet Care", description: "Pet sitting and walking services" },
      { name: "Tutoring", description: "Educational tutoring services" },
    ],
  },

  // Moving & Delivery
  {
    name: "Moving & Delivery",
    description: "Moving and delivery services",
    children: [
      { name: "Local Moving", description: "Local moving and relocation" },
      {
        name: "Furniture Delivery",
        description: "Deliver and assemble furniture",
      },
      { name: "Package Delivery", description: "Package and parcel delivery" },
      {
        name: "Storage Services",
        description: "Storage and warehousing services",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding categories...");

  for (const category of categories) {
    // Create parent category
    const parentCategory = await prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
        isActive: true,
        createdBy: "system",
      },
    });

    console.log(`✅ Created parent category: ${parentCategory.name}`);

    // Create child categories
    if (category.children) {
      for (const child of category.children) {
        const childCategory = await prisma.category.create({
          data: {
            name: child.name,
            description: child.description,
            parentId: parentCategory.id,
            isActive: true,
            createdBy: "system",
          },
        });

        console.log(`  ✅ Created subcategory: ${childCategory.name}`);
      }
    }
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

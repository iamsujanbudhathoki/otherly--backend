import { AppDataSource } from '../config/database.config';
import { CategoryEntity } from '../entities/category/Category.entity';
import { SubcategoryEntity } from '../entities/category/Subcategory.entity';
import { slugify } from '../utils/slugify';

interface CategorySeedData {
  name: string;
  description: string;
  icon?: string;
  displayOrder: number;
  isFeatured: boolean;
  subcategories: {
    name: string;
    description: string;
    displayOrder: number;
  }[];
}

const MARKETPLACE_CATEGORIES: CategorySeedData[] = [
  {
    name: 'Electronics & Components',
    description:
      'Consumer electronics, microcontrollers, display panels, and electrical assemblies',
    displayOrder: 1,
    isFeatured: true,
    subcategories: [
      {
        name: 'Microcontrollers & PCBs',
        description: 'Embedded boards, processors, and custom PCB fabrication',
        displayOrder: 1,
      },
      {
        name: 'Displays & Panels',
        description: 'LCD, OLED, and electronic touch panels',
        displayOrder: 2,
      },
      {
        name: 'Audio & Acoustics',
        description: 'Headphones, amplifiers, microphones, and transducers',
        displayOrder: 3,
      },
      {
        name: 'Cables & Interconnects',
        description: 'Industrial harnesses, HDMI, USB, and ribbon cables',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Industrial & Machinery',
    description:
      'Manufacturing tools, automated robotics, pneumatic components, and CNC fabrication equipment',
    displayOrder: 2,
    isFeatured: true,
    subcategories: [
      {
        name: 'CNC & Machining',
        description: 'Lathes, milling machines, and precision cutting tools',
        displayOrder: 1,
      },
      {
        name: 'Pneumatics & Hydraulics',
        description: 'Valves, cylinders, and fluid management systems',
        displayOrder: 2,
      },
      {
        name: 'Automation & Robotics',
        description: 'PLC units, robotic arms, and industrial sensors',
        displayOrder: 3,
      },
      {
        name: 'Motors & Actuators',
        description: 'Stepper motors, servo drives, and linear actuators',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Raw Materials & Metals',
    description:
      'Bulk raw commodities, metal alloys, polymers, and industrial chemicals',
    displayOrder: 3,
    isFeatured: true,
    subcategories: [
      {
        name: 'Steel & Aluminum Alloys',
        description: 'Extrusions, sheets, and structural bars',
        displayOrder: 1,
      },
      {
        name: 'Polymers & Engineering Plastics',
        description: 'Pellets, resins, PTFE, and nylon stock',
        displayOrder: 2,
      },
      {
        name: 'Carbon Fiber & Composites',
        description: 'Pre-preg sheets, carbon fabric, and fiberglass',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Packaging & Logistics Supplies',
    description:
      'Custom cartons, protective padding, thermal insulation, and palletizing materials',
    displayOrder: 4,
    isFeatured: false,
    subcategories: [
      {
        name: 'Custom Printed Boxes',
        description: 'Corrugated cartons, retail boxes, and mailers',
        displayOrder: 1,
      },
      {
        name: 'Protective Packaging',
        description: 'Air pillows, foam inserts, and biodegradable void fill',
        displayOrder: 2,
      },
      {
        name: 'Labels & Tamper Seals',
        description: 'Thermal labels, barcodes, and security tape',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Apparel & Commercial Textiles',
    description:
      'Wholesale garments, custom uniform embroidery, and specialized protective workwear',
    displayOrder: 5,
    isFeatured: false,
    subcategories: [
      {
        name: 'Workwear & Safety Gear',
        description:
          'High-visibility vests, flame-resistant jackets, and boots',
        displayOrder: 1,
      },
      {
        name: 'Custom Uniforms',
        description: 'Corporate shirts, caps, and branded embroidery',
        displayOrder: 2,
      },
      {
        name: 'Technical Fabrics',
        description: 'Waterproof membranes, ripstop fabrics, and canvas',
        displayOrder: 3,
      },
    ],
  },
];

const args = process.argv.slice(2)[0];

const seedMarketplace = async () => {
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const subcategoryRepo = AppDataSource.getRepository(SubcategoryEntity);

  for (const catData of MARKETPLACE_CATEGORIES) {
    const slug = slugify(catData.name);
    let category = await categoryRepo.findOne({ where: { slug } });

    if (!category) {
      category = categoryRepo.create({
        name: catData.name,
        slug,
        description: catData.description,
        icon: catData.icon,
        displayOrder: catData.displayOrder,
        isFeatured: catData.isFeatured,
        isActive: true,
      });
      category = await categoryRepo.save(category);
      console.log(`Created category: ${category.name}`);
    }

    for (const subData of catData.subcategories) {
      const subSlug = slugify(subData.name);
      const existingSub = await subcategoryRepo.findOne({
        where: { slug: subSlug, categoryId: category.id },
      });

      if (!existingSub) {
        const subcategory = subcategoryRepo.create({
          categoryId: category.id,
          name: subData.name,
          slug: subSlug,
          description: subData.description,
          displayOrder: subData.displayOrder,
          isActive: true,
        });
        await subcategoryRepo.save(subcategory);
        console.log(`  - Created subcategory: ${subcategory.name}`);
      }
    }
  }

  console.log('Marketplace categories & subcategories seeded successfully!');
  await AppDataSource.destroy();
  process.exit(0);
};

const removeMarketplace = async () => {
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const subcategoryRepo = AppDataSource.getRepository(SubcategoryEntity);

  await subcategoryRepo.createQueryBuilder().delete().execute();
  await categoryRepo.createQueryBuilder().delete().execute();

  console.log('Marketplace categories removed successfully');
  await AppDataSource.destroy();
  process.exit(0);
};

AppDataSource.initialize()
  .then(() => {
    if (args === 'add') {
      seedMarketplace();
    } else if (args === 'remove') {
      removeMarketplace();
    } else {
      console.log('Please provide a valid argument: add | remove');
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

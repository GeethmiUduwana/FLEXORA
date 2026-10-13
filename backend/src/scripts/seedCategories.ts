import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { CategoryStatus } from '../types/index.js';
import { slugify } from '../utils/slug.js';

export const INITIAL_CATEGORIES = [
  {
    name: 'Professional Services',
    icon: 'Briefcase',
    description: 'B2B and specialized professional advisory, digital, legal, and operational services.',
    displayOrder: 1,
    types: [
      'Consulting',
      'Software Company',
      'IT Services',
      'Marketing Agency',
      'Accounting Firm',
      'Law Firm',
      'Real Estate Agency',
      'Recruitment Agency',
      'Travel Agency',
      'Event Management',
      'Photography',
      'Cleaning Service',
      'Repair & Maintenance Service',
      'Freelance Professional',
    ],
  },
  {
    name: 'Health & Wellness',
    icon: 'HeartPulse',
    description: 'Medical practices, fitness studios, physical therapy, and wellness centers.',
    displayOrder: 2,
    types: [
      'Dental Clinic',
      'Medical Clinic',
      'Pharmacy',
      'Physiotherapy Center',
      'Veterinary Clinic',
      'Fitness Center',
      'Gym',
      'Yoga Center',
      'Spa',
      'Wellness Center',
      'Nutrition Center',
    ],
  },
  {
    name: 'Beauty & Personal Care',
    icon: 'Sparkles',
    description: 'Salons, barbers, skincare clinics, and aesthetic service providers.',
    displayOrder: 3,
    types: [
      'Salon',
      'Barber Shop',
      'Beauty Center',
      'Nail Salon',
      'Makeup Artist',
      'Skincare Center',
    ],
  },
  {
    name: 'Food & Hospitality',
    icon: 'UtensilsCrossed',
    description: 'Dining, bakeries, catering, and accommodation businesses.',
    displayOrder: 4,
    types: [
      'Restaurant',
      'Cafe',
      'Bakery',
      'Catering Service',
      'Food Delivery',
      'Hotel',
      'Guest House',
      'Villa',
      'Resort',
    ],
  },
  {
    name: 'Education',
    icon: 'GraduationCap',
    description: 'Schools, academies, training centers, and educational consulting services.',
    displayOrder: 5,
    types: [
      'School',
      'Tuition Center',
      'Training Institute',
      'Online Course Provider',
      'Language Institute',
      'Music School',
      'Driving School',
      'Educational Consultant',
    ],
  },
  {
    name: 'Retail & E-Commerce',
    icon: 'ShoppingBag',
    description: 'Physical stores, specialty boutiques, wholesale, and online e-commerce shops.',
    displayOrder: 6,
    types: [
      'Grocery Store',
      'Clothing Store',
      'Electronics Store',
      'Furniture Store',
      'Bookshop',
      'Online Store',
      'Wholesale Business',
      'Retail Store',
    ],
  },
  {
    name: 'Automotive',
    icon: 'Car',
    description: 'Vehicle maintenance, car wash, rentals, and automotive parts providers.',
    displayOrder: 7,
    types: [
      'Vehicle Repair',
      'Car Wash',
      'Vehicle Rental',
      'Auto Parts Store',
      'Vehicle Service Center',
    ],
  },
  {
    name: 'Construction & Home Services',
    icon: 'Hammer',
    description: 'Contractors, plumbing, electrical, interior design, and home maintenance.',
    displayOrder: 8,
    types: [
      'Construction Company',
      'Plumbing Service',
      'Electrical Service',
      'Landscaping',
      'Interior Design',
      'Home Cleaning',
      'Pest Control',
      'AC Repair',
      'Home Maintenance',
      'Painting Service',
    ],
  },
  {
    name: 'Other / Custom Business',
    icon: 'Grid',
    description: 'Specialized industries and bespoke businesses with customized business types.',
    displayOrder: 9,
    types: ['Other / Custom Business'],
  },
];

export async function seedCategoriesAndTypes(): Promise<void> {
  console.log('📦 Seeding Business Categories and Business Types...');

  for (const catData of INITIAL_CATEGORIES) {
    const catSlug = slugify(catData.name);

    const category = await BusinessCategory.findOneAndUpdate(
      { slug: catSlug },
      {
        name: catData.name,
        slug: catSlug,
        description: catData.description,
        icon: catData.icon,
        status: CategoryStatus.ACTIVE,
        displayOrder: catData.displayOrder,
      },
      { upsert: true, new: true }
    );

    for (const typeName of catData.types) {
      const typeSlug = slugify(typeName);
      const isCustom = typeName.toLowerCase().includes('custom') || catData.name.includes('Other');

      await BusinessType.findOneAndUpdate(
        { categoryId: category._id, slug: typeSlug },
        {
          name: typeName,
          slug: typeSlug,
          categoryId: category._id,
          description: `${typeName} operations under ${catData.name}`,
          status: CategoryStatus.ACTIVE,
          isCustom,
        },
        { upsert: true, new: true }
      );
    }
  }

  const categoryCount = await BusinessCategory.countDocuments({});
  const typeCount = await BusinessType.countDocuments({});
  console.log(`✅ Seeded ${categoryCount} Categories and ${typeCount} Business Types successfully!`);
}

// Allow standalone execution
if (process.argv[1]?.endsWith('seedCategories.ts')) {
  (async () => {
    await connectDatabase();
    await seedCategoriesAndTypes();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('❌ Failed to seed categories:', err);
    process.exit(1);
  });
}

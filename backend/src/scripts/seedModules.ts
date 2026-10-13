import { ModuleCategory } from '../models/ModuleCategory.js';
import { BusinessModule } from '../models/BusinessModule.js';
import { BusinessType } from '../models/BusinessType.js';
import { CategoryStatus, ModuleStatus } from '../types/index.js';

interface SeedModuleDef {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon?: string;
  depSlugs?: string[];
  recommendedTypeSlugs?: string[];
}

const MODULE_CATEGORIES = [
  { name: 'Customer & User', slug: 'customer-user', icon: 'Users', displayOrder: 1 },
  { name: 'Booking & Scheduling', slug: 'booking-scheduling', icon: 'Calendar', displayOrder: 2 },
  { name: 'Products & Inventory', slug: 'products-inventory', icon: 'Package', displayOrder: 3 },
  { name: 'Finance', slug: 'finance', icon: 'DollarSign', displayOrder: 4 },
  { name: 'Sales', slug: 'sales', icon: 'TrendingUp', displayOrder: 5 },
  { name: 'Operations', slug: 'operations', icon: 'CheckSquare', displayOrder: 6 },
  { name: 'Communication', slug: 'communication', icon: 'MessageSquare', displayOrder: 7 },
  { name: 'Marketing', slug: 'marketing', icon: 'Megaphone', displayOrder: 8 },
  { name: 'Reports & Analytics', slug: 'reports-analytics', icon: 'BarChart2', displayOrder: 9 },
  { name: 'Documents', slug: 'documents', icon: 'FileText', displayOrder: 10 },
  { name: 'Industry-Specific', slug: 'industry-specific', icon: 'Briefcase', displayOrder: 11 },
];

const MODULE_DEFINITIONS: SeedModuleDef[] = [
  // Customer & User
  {
    name: 'Customer Management',
    slug: 'customer-management',
    description: 'Centralized customer database, contact history, and client profiles.',
    categorySlug: 'customer-user',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'Users',
    recommendedTypeSlugs: ['consulting', 'salon', 'medical-clinic', 'retail-store'],
  },
  {
    name: 'User Management',
    slug: 'user-management',
    description: 'Administrative management of users, login accounts, and platform invitations.',
    categorySlug: 'customer-user',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'UserCheck',
  },
  {
    name: 'Employee Management',
    slug: 'employee-management',
    description: 'Staff directory, employment records, shifts, and team coordination.',
    categorySlug: 'customer-user',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Users',
    recommendedTypeSlugs: ['restaurant', 'hotel', 'construction-company'],
  },
  {
    name: 'Staff Management',
    slug: 'staff-management',
    description: 'Departmental staff allocations, assignment queues, and performance metrics.',
    categorySlug: 'customer-user',
    monthlyPrice: 20,
    yearlyPrice: 200,
    icon: 'Briefcase',
  },
  {
    name: 'Role & Permission Management',
    slug: 'role-permission-management',
    description: 'Granular access control, custom roles, and security policy enforcement.',
    categorySlug: 'customer-user',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'Shield',
    depSlugs: ['user-management'],
  },

  // Booking & Scheduling
  {
    name: 'Appointment Management',
    slug: 'appointment-management',
    description: 'Schedule, reschedule, and manage client appointments and slots.',
    categorySlug: 'booking-scheduling',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'Calendar',
    recommendedTypeSlugs: ['salon', 'barber-shop', 'dental-clinic', 'medical-clinic', 'fitness-center'],
  },
  {
    name: 'Booking Management',
    slug: 'booking-management',
    description: 'Facility, room, and equipment reservations with availability checks.',
    categorySlug: 'booking-scheduling',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'Clock',
    recommendedTypeSlugs: ['hotel', 'villa', 'guest-house', 'vehicle-rental'],
  },
  {
    name: 'Online Booking',
    slug: 'online-booking',
    description: 'Customer-facing self-service booking portal embedded on your website.',
    categorySlug: 'booking-scheduling',
    monthlyPrice: 35,
    yearlyPrice: 350,
    icon: 'Globe',
    depSlugs: ['appointment-management'],
    recommendedTypeSlugs: ['salon', 'barber-shop', 'dental-clinic', 'medical-clinic', 'yoga-center'],
  },
  {
    name: 'Calendar Management',
    slug: 'calendar-management',
    description: 'Interactive team calendar views, sync with Google/Outlook, and scheduling reminders.',
    categorySlug: 'booking-scheduling',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'Calendar',
  },

  // Products & Inventory
  {
    name: 'Product Management',
    slug: 'product-management',
    description: 'Maintain item catalogs, variants, pricing tiers, and product images.',
    categorySlug: 'products-inventory',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Package',
    recommendedTypeSlugs: ['grocery-store', 'clothing-store', 'electronics-store', 'bookshop', 'retail-store'],
  },
  {
    name: 'Inventory Management',
    slug: 'inventory-management',
    description: 'Stock level tracking, reorder thresholds, warehouse locations, and batch records.',
    categorySlug: 'products-inventory',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'Boxes',
    depSlugs: ['product-management'],
    recommendedTypeSlugs: ['grocery-store', 'electronics-store', 'wholesale-business', 'retail-store', 'pharmacy'],
  },
  {
    name: 'Stock Management',
    slug: 'stock-management',
    description: 'Real-time stock counting, audits, stocktakes, and variance logging.',
    categorySlug: 'products-inventory',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'CheckSquare',
    depSlugs: ['product-management'],
    recommendedTypeSlugs: ['grocery-store', 'auto-parts-store', 'retail-store'],
  },
  {
    name: 'Supplier Management',
    slug: 'supplier-management',
    description: 'Vendor database, contact terms, purchase orders, and supplier rating history.',
    categorySlug: 'products-inventory',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Truck',
    recommendedTypeSlugs: ['restaurant', 'wholesale-business', 'grocery-store'],
  },

  // Finance
  {
    name: 'Billing',
    slug: 'billing',
    description: 'Account billing cycles, recurring charges, and customer ledger summaries.',
    categorySlug: 'finance',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'DollarSign',
  },
  {
    name: 'Invoice Management',
    slug: 'invoice-management',
    description: 'Create, send, and track PDF invoices with automated reminder notices.',
    categorySlug: 'finance',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'FileText',
    depSlugs: ['billing'],
    recommendedTypeSlugs: ['consulting', 'software-company', 'law-firm', 'accounting-firm', 'marketing-agency'],
  },
  {
    name: 'Payment Management',
    slug: 'payment-management',
    description: 'Accept credit card, bank, and digital wallet payments with reconciliation.',
    categorySlug: 'finance',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'CreditCard',
    depSlugs: ['billing'],
  },
  {
    name: 'Expense Management',
    slug: 'expense-management',
    description: 'Log operating expenses, receipts, cost categories, and reimbursement requests.',
    categorySlug: 'finance',
    monthlyPrice: 20,
    yearlyPrice: 200,
    icon: 'Receipt',
  },
  {
    name: 'Quotation / Estimate Management',
    slug: 'quotation-estimate-management',
    description: 'Generate client price estimates, proposals, and convert quotes to invoices.',
    categorySlug: 'finance',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'FileSpreadsheet',
    recommendedTypeSlugs: ['construction-company', 'plumbing-service', 'electrical-service', 'interior-design'],
  },
  {
    name: 'Financial Reports',
    slug: 'financial-reports',
    description: 'Profit and loss statements, revenue projections, tax ledgers, and cash flow graphs.',
    categorySlug: 'finance',
    monthlyPrice: 30,
    yearlyPrice: 300,
    icon: 'PieChart',
    depSlugs: ['billing'],
  },

  // Sales
  {
    name: 'Sales Management',
    slug: 'sales-management',
    description: 'Sales pipelines, deal tracking, lead stages, and conversion metrics.',
    categorySlug: 'sales',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'TrendingUp',
    recommendedTypeSlugs: ['real-estate-agency', 'software-company', 'recruitment-agency'],
  },
  {
    name: 'Order Management',
    slug: 'order-management',
    description: 'Order fulfillment status, dispatch tracking, packing, and fulfillment workflows.',
    categorySlug: 'sales',
    monthlyPrice: 35,
    yearlyPrice: 350,
    icon: 'ShoppingBag',
    depSlugs: ['sales-management'],
    recommendedTypeSlugs: ['online-store', 'clothing-store', 'electronics-store', 'bakery'],
  },
  {
    name: 'Point of Sale',
    slug: 'point-of-sale',
    description: 'Barcode scanning, fast counter checkout, receipt printing, and cash drawer sync.',
    categorySlug: 'sales',
    monthlyPrice: 49,
    yearlyPrice: 490,
    icon: 'Monitor',
    depSlugs: ['sales-management'],
    recommendedTypeSlugs: ['grocery-store', 'cafe', 'restaurant', 'retail-store', 'bakery'],
  },
  {
    name: 'Discount Management',
    slug: 'discount-management',
    description: 'Promotional discount coupons, flash sales, customer group rules, and markdown codes.',
    categorySlug: 'sales',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'Tag',
  },

  // Operations
  {
    name: 'Task Management',
    slug: 'task-management',
    description: 'Task assignments, due date tracking, team checklists, and priority boards.',
    categorySlug: 'operations',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'CheckSquare',
  },
  {
    name: 'Job Management',
    slug: 'job-management',
    description: 'Field service work orders, dispatch routing, technician tracking, and job sign-offs.',
    categorySlug: 'operations',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Wrench',
    recommendedTypeSlugs: ['plumbing-service', 'electrical-service', 'ac-repair', 'pest-control'],
  },
  {
    name: 'Project Management',
    slug: 'project-management',
    description: 'Milestones, Gantt timeline tracking, resource allocation, and team collaboration.',
    categorySlug: 'operations',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'Layers',
    depSlugs: ['task-management'],
    recommendedTypeSlugs: ['software-company', 'it-services', 'construction-company', 'marketing-agency'],
  },
  {
    name: 'Service Management',
    slug: 'service-management',
    description: 'Configurable service menu, duration estimates, pricing tiers, and warranties.',
    categorySlug: 'operations',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Tool',
    recommendedTypeSlugs: ['repair-maintenance-service', 'vehicle-repair', 'cleaning-service'],
  },
  {
    name: 'Delivery Management',
    slug: 'delivery-management',
    description: 'Driver route dispatch, customer delivery notifications, and proof-of-delivery.',
    categorySlug: 'operations',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'Truck',
    recommendedTypeSlugs: ['food-delivery', 'restaurant', 'catering-service'],
  },
  {
    name: 'Asset Management',
    slug: 'asset-management',
    description: 'Company equipment inventory, maintenance schedules, serial IDs, and warranty cards.',
    categorySlug: 'operations',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'HardDrive',
  },

  // Communication
  {
    name: 'Notifications',
    slug: 'notifications',
    description: 'System alerts, customer confirmation pings, and in-app bell notifications.',
    categorySlug: 'communication',
    monthlyPrice: 10,
    yearlyPrice: 100,
    icon: 'Bell',
  },
  {
    name: 'Email Notifications',
    slug: 'email-notifications',
    description: 'Transactional email dispatch, customizable email templates, and delivery logs.',
    categorySlug: 'communication',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'Mail',
    depSlugs: ['notifications'],
  },
  {
    name: 'SMS Notifications',
    slug: 'sms-notifications',
    description: 'Direct SMS appointment reminders, order updates, and two-way messaging.',
    categorySlug: 'communication',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'Smartphone',
    depSlugs: ['notifications'],
  },
  {
    name: 'Internal Messaging',
    slug: 'internal-messaging',
    description: 'Team chat channels, direct staff communication, and file sharing within the workspace.',
    categorySlug: 'communication',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'MessageCircle',
  },

  // Marketing
  {
    name: 'CRM',
    slug: 'crm',
    description: 'Comprehensive customer relationship management, sales touchpoints, and lifetime value.',
    categorySlug: 'marketing',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'HeartHandshake',
    depSlugs: ['customer-management'],
    recommendedTypeSlugs: ['consulting', 'marketing-agency', 'real-estate-agency'],
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Campaign tracking, subscriber newsletters, social media links, and lead capture.',
    categorySlug: 'marketing',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'Megaphone',
  },
  {
    name: 'Promotions',
    slug: 'promotions',
    description: 'Seasonal promotion campaigns, banner announcements, and special offer rules.',
    categorySlug: 'marketing',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'Zap',
  },
  {
    name: 'Loyalty Program',
    slug: 'loyalty-program',
    description: 'Customer loyalty points, membership rewards tiers, and redemption tracking.',
    categorySlug: 'marketing',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Award',
    depSlugs: ['customer-management'],
    recommendedTypeSlugs: ['cafe', 'salon', 'retail-store', 'clothing-store'],
  },
  {
    name: 'Reviews & Ratings',
    slug: 'reviews-ratings',
    description: 'Collect, moderate, and publish verified client feedback on your public site.',
    categorySlug: 'marketing',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'Star',
  },

  // Reports & Analytics
  {
    name: 'Reports & Analytics',
    slug: 'reports-analytics',
    description: 'Exportable business data reports, metric summaries, and automated schedule delivery.',
    categorySlug: 'reports-analytics',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'BarChart2',
  },
  {
    name: 'Dashboard Analytics',
    slug: 'dashboard-analytics',
    description: 'Live interactive KPI widgets, trend lines, visitor graphs, and activity counters.',
    categorySlug: 'reports-analytics',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Activity',
  },
  {
    name: 'Business Performance Reports',
    slug: 'business-performance-reports',
    description: 'Quarterly reviews, staff productivity rankings, and revenue growth breakdowns.',
    categorySlug: 'reports-analytics',
    monthlyPrice: 35,
    yearlyPrice: 350,
    icon: 'TrendingUp',
  },

  // Documents
  {
    name: 'Document Management',
    slug: 'document-management',
    description: 'Contracts, agreement templates, digital client signatures, and document vault.',
    categorySlug: 'documents',
    monthlyPrice: 20,
    yearlyPrice: 200,
    icon: 'Folder',
    recommendedTypeSlugs: ['law-firm', 'accounting-firm', 'real-estate-agency'],
  },
  {
    name: 'File Management',
    slug: 'file-management',
    description: 'Cloud storage workspace, attachment sharing, and version history.',
    categorySlug: 'documents',
    monthlyPrice: 15,
    yearlyPrice: 150,
    icon: 'File',
  },
  {
    name: 'Media Management',
    slug: 'media-management',
    description: 'Image and video library, watermarking, responsive compression, and media CDN.',
    categorySlug: 'documents',
    monthlyPrice: 19,
    yearlyPrice: 190,
    icon: 'Image',
    recommendedTypeSlugs: ['photography', 'marketing-agency', 'interior-design'],
  },

  // Industry-Specific
  {
    name: 'Patient Management',
    slug: 'patient-management',
    description: 'Clinical patient profiles, medical history logs, and confidential patient records.',
    categorySlug: 'industry-specific',
    monthlyPrice: 49,
    yearlyPrice: 490,
    icon: 'HeartPulse',
    recommendedTypeSlugs: ['dental-clinic', 'medical-clinic', 'physiotherapy-center', 'veterinary-clinic'],
  },
  {
    name: 'Treatment Records',
    slug: 'treatment-records',
    description: 'Clinical progress notes, procedure checklists, dental charts, and recovery tracking.',
    categorySlug: 'industry-specific',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'Clipboard',
    depSlugs: ['patient-management'],
    recommendedTypeSlugs: ['dental-clinic', 'medical-clinic', 'physiotherapy-center'],
  },
  {
    name: 'Prescription Management',
    slug: 'prescription-management',
    description: 'Issue e-prescriptions, track dosage guidelines, and medicine refill requests.',
    categorySlug: 'industry-specific',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'FilePlus',
    depSlugs: ['patient-management'],
    recommendedTypeSlugs: ['dental-clinic', 'medical-clinic', 'pharmacy'],
  },
  {
    name: 'Student Management',
    slug: 'student-management',
    description: 'Student enrollments, attendance tracking, guardian contacts, and grades.',
    categorySlug: 'industry-specific',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'GraduationCap',
    recommendedTypeSlugs: ['school', 'tuition-center', 'training-institute', 'online-course-provider'],
  },
  {
    name: 'Course Management',
    slug: 'course-management',
    description: 'Syllabus builder, lesson modules, course schedules, and material uploads.',
    categorySlug: 'industry-specific',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: 'BookOpen',
    recommendedTypeSlugs: ['training-institute', 'online-course-provider', 'language-institute', 'music-school'],
  },
  {
    name: 'Class Management',
    slug: 'class-management',
    description: 'Timetables, classroom rosters, student capacity limits, and instructor assignments.',
    categorySlug: 'industry-specific',
    monthlyPrice: 25,
    yearlyPrice: 250,
    icon: 'Users',
    depSlugs: ['course-management'],
    recommendedTypeSlugs: ['school', 'tuition-center', 'driving-school', 'music-school'],
  },
  {
    name: 'Membership Management',
    slug: 'membership-management',
    description: 'Gym/club pass plans, member check-in kiosk, RFID access, and automated renewals.',
    categorySlug: 'industry-specific',
    monthlyPrice: 35,
    yearlyPrice: 350,
    icon: 'IdCard',
    recommendedTypeSlugs: ['fitness-center', 'gym', 'yoga-center', 'spa'],
  },
  {
    name: 'Property Management',
    slug: 'property-management',
    description: 'Real estate listing catalog, tenant leases, property inspections, and rent collection.',
    categorySlug: 'industry-specific',
    monthlyPrice: 49,
    yearlyPrice: 490,
    icon: 'Building',
    recommendedTypeSlugs: ['real-estate-agency', 'hotel', 'villa'],
  },
  {
    name: 'Vehicle Management',
    slug: 'vehicle-management',
    description: 'Fleet tracking, vehicle service history, mileage records, and rental availability.',
    categorySlug: 'industry-specific',
    monthlyPrice: 39,
    yearlyPrice: 390,
    icon: 'Car',
    recommendedTypeSlugs: ['vehicle-repair', 'car-wash', 'vehicle-rental', 'vehicle-service-center'],
  },
  {
    name: 'Event Management',
    slug: 'event-management',
    description: 'Event registration, ticketing tiers, guest lists, catering timelines, and venue maps.',
    categorySlug: 'industry-specific',
    monthlyPrice: 35,
    yearlyPrice: 350,
    icon: 'PartyPopper',
    recommendedTypeSlugs: ['event-management', 'photography', 'catering-service'],
  },
];

export async function seedModuleCatalog(): Promise<void> {
  console.log('--- Seeding Module Categories & Reusable Modules ---');

  // 1. Seed Module Categories
  const categoryMap = new Map<string, any>();
  for (const cat of MODULE_CATEGORIES) {
    const existing = await ModuleCategory.findOne({ slug: cat.slug });
    if (!existing) {
      const created = await ModuleCategory.create({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        status: CategoryStatus.ACTIVE,
      });
      categoryMap.set(cat.slug, created);
      console.log(`Created Module Category: ${cat.name}`);
    } else {
      categoryMap.set(cat.slug, existing);
    }
  }

  // 2. Fetch all business types to resolve recommended types by slug
  const allBusinessTypes = await BusinessType.find({}).lean();
  const businessTypeSlugMap = new Map<string, any>();
  allBusinessTypes.forEach((bt) => businessTypeSlugMap.set(bt.slug, bt._id));

  // 3. First pass: Seed or update modules without dependencies (to ensure IDs exist)
  const moduleSlugMap = new Map<string, any>();
  for (const modDef of MODULE_DEFINITIONS) {
    const category = categoryMap.get(modDef.categorySlug);
    if (!category) continue;

    const recommendedTypeIds = (modDef.recommendedTypeSlugs || [])
      .map((slug) => businessTypeSlugMap.get(slug))
      .filter(Boolean);

    let moduleDoc = await BusinessModule.findOne({ slug: modDef.slug });
    if (!moduleDoc) {
      moduleDoc = await BusinessModule.create({
        name: modDef.name,
        slug: modDef.slug,
        description: modDef.description,
        icon: modDef.icon || 'Package',
        moduleCategoryId: category._id,
        monthlyPrice: modDef.monthlyPrice,
        yearlyPrice: modDef.yearlyPrice,
        currency: 'USD',
        status: ModuleStatus.ACTIVE,
        dependencies: [],
        recommendedBusinessTypes: recommendedTypeIds,
      });
      console.log(`Created Reusable Module: ${modDef.name}`);
    } else {
      // Update metadata & recommendations if already exists
      moduleDoc.recommendedBusinessTypes = recommendedTypeIds;
      await moduleDoc.save();
    }
    moduleSlugMap.set(modDef.slug, moduleDoc);
  }

  // 4. Second pass: Link dependencies
  for (const modDef of MODULE_DEFINITIONS) {
    if (modDef.depSlugs && modDef.depSlugs.length > 0) {
      const moduleDoc = moduleSlugMap.get(modDef.slug);
      if (!moduleDoc) continue;

      const depIds = modDef.depSlugs
        .map((depSlug) => moduleSlugMap.get(depSlug)?._id)
        .filter(Boolean);

      moduleDoc.dependencies = depIds;
      await moduleDoc.save();
      console.log(`Linked dependencies for "${modDef.name}": [${modDef.depSlugs.join(', ')}]`);
    }
  }

  console.log('--- Module Catalog Seeding Complete ---');
}

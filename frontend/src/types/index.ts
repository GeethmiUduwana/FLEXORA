export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum ModuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: CategoryStatus;
  displayOrder: number;
  businessTypeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBusinessType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: IBusinessCategory;
  description?: string;
  status: CategoryStatus;
  isCustom: boolean;
  businessCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBusiness {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  categoryId: string;
  category?: IBusinessCategory;
  businessTypeId?: string | null;
  businessType?: IBusinessType | null;
  customBusinessType?: string | null;
  description: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  logo?: string | null;
  employeeCount?: number;
  customerCount?: number;
  mainServices?: string[];
  productsSold?: string[];
  onlineBookingRequired: boolean;
  onlinePaymentsRequired: boolean;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IModuleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: CategoryStatus;
  displayOrder: number;
  moduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  moduleCategoryId: string;
  moduleCategory?: IModuleCategory;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  status: ModuleStatus;
  dependencies: string[];
  dependencyModules?: IBusinessModule[];
  recommendedBusinessTypes: string[];
  recommendedTypes?: IBusinessType[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  businessOwners: number;
  managers: number;
  staff: number;
  platformAdmins: number;
  suspendedUsers: number;
  pendingUsers: number;
  totalBusinessCategories?: number;
  activeBusinessCategories?: number;
  totalBusinessTypes?: number;
  totalModuleCategories?: number;
  totalModules?: number;
  activeModules?: number;
  inactiveModules?: number;
  archivedModules?: number;
  modulesWithDependencies?: number;
  modulesWithoutRecommendations?: number;
}

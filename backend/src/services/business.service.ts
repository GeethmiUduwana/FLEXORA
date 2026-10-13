import mongoose, { Types } from 'mongoose';
import { Business } from '../models/Business.js';
import { BusinessCategory } from '../models/BusinessCategory.js';
import { BusinessType } from '../models/BusinessType.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { CategoryStatus, BusinessStatus, UserRole, MembershipStatus } from '../types/index.js';
import { slugify } from '../utils/slug.js';

export class BusinessService {
  static async createBusiness(ownerId: string, data: any) {
    // 1. Verify Category exists and is active
    const category = await BusinessCategory.findOne({
      _id: data.categoryId,
      status: CategoryStatus.ACTIVE,
    });

    if (!category) {
      const error: any = new Error('Selected business category not found or is currently inactive');
      error.statusCode = 400;
      throw error;
    }

    let businessType: any = null;

    // 2. Validate Business Type if provided
    if (data.businessTypeId) {
      businessType = await BusinessType.findOne({
        _id: data.businessTypeId,
        status: CategoryStatus.ACTIVE,
      });

      if (!businessType) {
        const error: any = new Error('Selected business type not found or is currently inactive');
        error.statusCode = 400;
        throw error;
      }

      // Security check: Verify that the business type belongs to the selected category
      if (businessType.categoryId.toString() !== category._id.toString()) {
        const error: any = new Error('Selected business type does not belong to the selected category');
        error.statusCode = 400;
        throw error;
      }

      // If business type is custom, customBusinessType is required
      if (businessType.isCustom && (!data.customBusinessType || !data.customBusinessType.trim())) {
        const error: any = new Error('Please specify your custom business type');
        error.statusCode = 400;
        throw error;
      }
    } else {
      // If no business type is provided and category is custom, ensure custom text is provided
      if (category.name.toLowerCase().includes('other') || category.name.toLowerCase().includes('custom')) {
        if (!data.customBusinessType || !data.customBusinessType.trim()) {
          const error: any = new Error('Please specify your custom business type');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // 3. Generate unique business slug
    const baseSlug = slugify(data.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await Business.exists({ slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    // 4. Create Business Document
    const business = new Business({
      name: data.name.trim(),
      slug: uniqueSlug,
      ownerId: new Types.ObjectId(ownerId),
      categoryId: category._id,
      businessTypeId: businessType ? businessType._id : null,
      customBusinessType: data.customBusinessType ? data.customBusinessType.trim() : null,
      description: data.description.trim(),
      email: data.email ? data.email.trim().toLowerCase() : null,
      phone: data.phone ? data.phone.trim() : null,
      address: data.address ? data.address.trim() : null,
      website: data.website ? data.website.trim() : null,
      logo: data.logo ? data.logo.trim() : null,
      employeeCount: data.employeeCount || 0,
      customerCount: data.customerCount || 0,
      mainServices: Array.isArray(data.mainServices) ? data.mainServices : [],
      productsSold: Array.isArray(data.productsSold) ? data.productsSold : [],
      onlineBookingRequired: Boolean(data.onlineBookingRequired),
      onlinePaymentsRequired: Boolean(data.onlinePaymentsRequired),
      status: BusinessStatus.ACTIVE,
    });

    await business.save();

    // 5. Multi-Tenant Membership mapping
    await BusinessMembership.findOneAndUpdate(
      { user: new Types.ObjectId(ownerId), tenantId: business._id.toString() },
      {
        user: new Types.ObjectId(ownerId),
        tenantId: business._id.toString(),
        role: UserRole.BUSINESS_OWNER,
        status: MembershipStatus.ACTIVE,
      },
      { upsert: true }
    );

    // Populate for return
    await business.populate([
      { path: 'categoryId', select: 'name slug icon description' },
      { path: 'businessTypeId', select: 'name slug description isCustom' },
    ]);

    return business.toSafeJSON();
  }

  static async getMyBusinesses(ownerId: string) {
    const businesses = await Business.find({
      ownerId: new Types.ObjectId(ownerId),
    })
      .populate([
        { path: 'categoryId', select: 'name slug icon description' },
        { path: 'businessTypeId', select: 'name slug description isCustom' },
      ])
      .sort({ createdAt: -1 });

    return businesses.map((b) => b.toSafeJSON());
  }

  static async getBusinessById(businessId: string, userId: string, userRole: UserRole) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      const error: any = new Error('Business not found');
      error.statusCode = 404;
      throw error;
    }

    const business = await Business.findById(businessId).populate([
      { path: 'categoryId', select: 'name slug icon description' },
      { path: 'businessTypeId', select: 'name slug description isCustom' },
    ]);

    if (!business) {
      const error: any = new Error('Business not found');
      error.statusCode = 404;
      throw error;
    }

    // Multi-tenant authorization check:
    // Only the business owner or platform admin can access this business record
    if (userRole !== UserRole.PLATFORM_ADMIN && business.ownerId.toString() !== userId) {
      const error: any = new Error('Business not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    return business.toSafeJSON();
  }

  static async updateBusiness(
    businessId: string,
    userId: string,
    userRole: UserRole,
    data: any
  ) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      const error: any = new Error('Business not found');
      error.statusCode = 404;
      throw error;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      const error: any = new Error('Business not found');
      error.statusCode = 404;
      throw error;
    }

    // Ownership verification
    if (userRole !== UserRole.PLATFORM_ADMIN && business.ownerId.toString() !== userId) {
      const error: any = new Error('Unauthorized to update this business');
      error.statusCode = 403;
      throw error;
    }

    // Safely update only permitted fields (strictly never ownerId, slug, status)
    if (data.name !== undefined) business.name = data.name.trim();
    if (data.description !== undefined) business.description = data.description.trim();
    if (data.email !== undefined) business.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.phone !== undefined) business.phone = data.phone ? data.phone.trim() : null;
    if (data.address !== undefined) business.address = data.address ? data.address.trim() : null;
    if (data.website !== undefined) business.website = data.website ? data.website.trim() : null;
    if (data.logo !== undefined) business.logo = data.logo ? data.logo.trim() : null;
    if (data.employeeCount !== undefined) business.employeeCount = Number(data.employeeCount) || 0;
    if (data.customerCount !== undefined) business.customerCount = Number(data.customerCount) || 0;
    if (data.mainServices !== undefined && Array.isArray(data.mainServices)) business.mainServices = data.mainServices;
    if (data.productsSold !== undefined && Array.isArray(data.productsSold)) business.productsSold = data.productsSold;
    if (data.onlineBookingRequired !== undefined) business.onlineBookingRequired = Boolean(data.onlineBookingRequired);
    if (data.onlinePaymentsRequired !== undefined) business.onlinePaymentsRequired = Boolean(data.onlinePaymentsRequired);

    await business.save();

    await business.populate([
      { path: 'categoryId', select: 'name slug icon description' },
      { path: 'businessTypeId', select: 'name slug description isCustom' },
    ]);

    return business.toSafeJSON();
  }
}

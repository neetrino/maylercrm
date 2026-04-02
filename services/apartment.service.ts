import { prisma } from '@/lib/prisma';
import type { Apartment, ApartmentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export const apartmentService = {
  async getAll(filters?: {
    buildingId?: number;
    status?: ApartmentStatus;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 21, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ApartmentWhereInput = {};

    if (filters?.buildingId) {
      where.buildingId = filters.buildingId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const searchTrimmed = filters?.search?.trim();
    if (searchTrimmed) {
      where.OR = [
        { apartmentNo: { contains: searchTrimmed, mode: 'insensitive' } },
        { building: { name: { contains: searchTrimmed, mode: 'insensitive' } } },
        { building: { district: { name: { contains: searchTrimmed, mode: 'insensitive' } } } },
        { ownershipName: { contains: searchTrimmed, mode: 'insensitive' } },
      ];
    }

    // Определяем поле и порядок сортировки
    const sortBy = filters?.sortBy || 'apartmentNo';
    const sortOrder = filters?.sortOrder || 'asc';

    // Маппинг полей для сортировки
    let orderBy: Prisma.ApartmentOrderByWithRelationInput = {
      apartmentNo: sortOrder,
    };

    switch (sortBy) {
      case 'apartmentNo':
        orderBy = { apartmentNo: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      case 'sqm':
        orderBy = { sqm: sortOrder };
        break;
      case 'total_price':
        // Сортировка по вычисляемому полю - используем totalPrice из БД
        orderBy = { totalPrice: sortOrder };
        break;
      case 'total_paid':
        orderBy = { totalPaid: sortOrder };
        break;
      case 'balance':
        // Для balance используем сортировку по totalPrice и totalPaid
        // Это приблизительная сортировка, точная требует вычисления
        orderBy = { totalPrice: sortOrder };
        break;
      case 'building':
        // Сортировка по зданию будет выполнена после получения данных
        // Используем apartmentNo как временную сортировку
        orderBy = { apartmentNo: 'asc' };
        break;
      default:
        orderBy = { apartmentNo: 'asc' };
    }

    // Оптимизация: используем select вместо include для меньшего объёма данных
    const [apartments, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        select: {
          id: true,
          buildingId: true,
          apartmentNo: true,
          apartmentName: true,
          apartmentType: true,
          floor: true,
          status: true,
          sqm: true,
          priceSqm: true,
          totalPrice: true,
          totalPaid: true,
          dealDate: true,
          ownershipName: true,
          email: true,
          passportTaxNo: true,
          phone: true,
          salesType: true,
          dealDescription: true,
        matterLink: true,
        floorplanDistribution: true,
        exteriorLink: true,
        exteriorLink2: true,
        buyerAddress: true,
        otherBuyers: true,
        paymentSchedule: true,
        balanceRemaining: true,
        landingToken: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        building: {
          select: {
            id: true,
            name: true,
            slug: true,
            district: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          attachments: {
            select: {
              id: true,
              fileType: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              md5Hash: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.apartment.count({ where }),
    ]);

    // Вычисляемые поля
    let apartmentsWithCalculations = apartments.map((apt) => {
      const totalPrice =
        apt.sqm && apt.priceSqm
          ? Number(apt.sqm) * Number(apt.priceSqm)
          : null;

      const balance =
        totalPrice && apt.totalPaid
          ? totalPrice - Number(apt.totalPaid)
          : totalPrice;

      return {
        ...apt,
        total_price: totalPrice,
        balance,
        sqm: apt.sqm ? Number(apt.sqm) : null,
        price_sqm: apt.priceSqm ? Number(apt.priceSqm) : null,
        total_paid: apt.totalPaid ? Number(apt.totalPaid) : null,
        deal_date: apt.dealDate ? apt.dealDate.toISOString().split('T')[0] : null,
        ownership_name: apt.ownershipName,
        email: apt.email,
        passport_tax_no: apt.passportTaxNo,
        phone: apt.phone,
        sales_type: apt.salesType,
        deal_description: apt.dealDescription,
        matter_link: apt.matterLink,
        floorplan_distribution: apt.floorplanDistribution,
        exterior_link: apt.exteriorLink,
        exterior_link2: apt.exteriorLink2,
        buyer_address: apt.buyerAddress,
        other_buyers: apt.otherBuyers,
        payment_schedule: apt.paymentSchedule,
        balance_remaining: apt.balanceRemaining ? Number(apt.balanceRemaining) : null,
        attachments: apt.attachments || [],
      };
    });

    // Если сортировка по balance, сортируем после вычисления
    if (sortBy === 'balance') {
      apartmentsWithCalculations.sort((a, b) => {
        const balanceA = a.balance ?? 0;
        const balanceB = b.balance ?? 0;
        return sortOrder === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      });
    }

    // Если сортировка по building, сортируем по имени здания после получения данных
    if (sortBy === 'building') {
      apartmentsWithCalculations.sort((a, b) => {
        const buildingA = `${a.building.district.name} - ${a.building.name}`;
        const buildingB = `${b.building.district.name} - ${b.building.name}`;
        if (sortOrder === 'asc') {
          return buildingA.localeCompare(buildingB);
        } else {
          return buildingB.localeCompare(buildingA);
        }
      });
    }

    return {
      items: apartmentsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: number) {
    // Оптимизация: используем select для загрузки только нужных полей
    const apartment = await prisma.apartment.findUnique({
      where: { id },
      select: {
        id: true,
        buildingId: true,
        apartmentNo: true,
        apartmentName: true,
        apartmentType: true,
        floor: true,
        status: true,
        sqm: true,
        priceSqm: true,
        totalPrice: true,
        totalPaid: true,
        dealDate: true,
        ownershipName: true,
        email: true,
        passportTaxNo: true,
        phone: true,
        salesType: true,
        dealDescription: true,
        matterLink: true,
        floorplanDistribution: true,
        exteriorLink: true,
        exteriorLink2: true,
        buyerAddress: true,
        otherBuyers: true,
        paymentSchedule: true,
        balanceRemaining: true,
        landingToken: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        building: {
          select: {
            id: true,
            name: true,
            slug: true,
            district: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileType: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            md5Hash: true,
            createdAt: true,
          },
        },
      },
    });

    if (!apartment) {
      return null;
    }

    // Вычисляемые поля
    const totalPrice =
      apartment.sqm && apartment.priceSqm
        ? Number(apartment.sqm) * Number(apartment.priceSqm)
        : null;

    const balance =
      totalPrice && apartment.totalPaid
        ? totalPrice - Number(apartment.totalPaid)
        : totalPrice;

    return {
      ...apartment,
      total_price: totalPrice,
      balance,
      sqm: apartment.sqm ? Number(apartment.sqm) : null,
      price_sqm: apartment.priceSqm ? Number(apartment.priceSqm) : null,
      total_paid: apartment.totalPaid ? Number(apartment.totalPaid) : null,
      buyer_address: apartment.buyerAddress,
      other_buyers: apartment.otherBuyers,
      payment_schedule: apartment.paymentSchedule,
      balance_remaining: apartment.balanceRemaining ? Number(apartment.balanceRemaining) : null,
      attachments: apartment.attachments,
      building_name: apartment.building.name,
      building_slug: apartment.building.slug,
      district_id: apartment.building.district.id,
      district_slug: apartment.building.district.slug,
      district_name: apartment.building.district.name,
    };
  },

  async create(data: {
    buildingId: number;
    apartmentNo: string;
    apartmentName?: string | null;
    apartmentType?: number;
    floor?: number;
    sqm?: number;
    priceSqm?: number;
    status?: ApartmentStatus;
  }) {
    // Проверка существования здания
    const building = await prisma.building.findUnique({
      where: { id: data.buildingId },
    });

    if (!building) {
      throw new Error('Здание не найдено');
    }

    // Проверка уникальности apartment_no в здании
    const existing = await prisma.apartment.findUnique({
      where: {
        buildingId_apartmentNo: {
          buildingId: data.buildingId,
          apartmentNo: data.apartmentNo.trim(),
        },
      },
    });

    if (existing) {
      throw new Error(
        `Квартира с номером ${data.apartmentNo} уже существует в этом здании`
      );
    }

    // Вычисление total_price
    const totalPrice =
      data.sqm && data.priceSqm
        ? new Prisma.Decimal(data.sqm * data.priceSqm)
        : null;

    return await prisma.apartment.create({
      data: {
        buildingId: data.buildingId,
        apartmentNo: data.apartmentNo.trim(),
        apartmentName: data.apartmentName?.trim() || null,
        apartmentType: data.apartmentType,
        floor: data.floor,
        sqm: data.sqm,
        priceSqm: data.priceSqm,
        totalPrice: totalPrice,
        status: data.status || 'UPCOMING',
      },
      include: {
        building: {
          include: {
            district: true,
          },
        },
      },
    });
  },

  async update(id: number, data: Prisma.ApartmentUpdateInput) {
    // Если обновляются sqm или priceSqm, пересчитываем totalPrice
    if (data.sqm !== undefined || data.priceSqm !== undefined) {
      const current = await prisma.apartment.findUnique({
        where: { id },
        select: { sqm: true, priceSqm: true },
      });

      if (current) {
        const sqm = data.sqm !== undefined ? data.sqm : current.sqm;
        const priceSqm =
          data.priceSqm !== undefined ? data.priceSqm : current.priceSqm;

        if (sqm && priceSqm) {
          data.totalPrice = new Prisma.Decimal(Number(sqm) * Number(priceSqm));
        }
      }
    }

    return await prisma.apartment.update({
      where: { id },
      data,
      include: {
        building: {
          include: {
            district: true,
          },
        },
      },
    });
  },

  async updateStatus(id: number, status: ApartmentStatus) {
    // Валидация: при статусе SOLD желательно иметь deal_date и ownership_name
    if (status === 'SOLD') {
      const apartment = await prisma.apartment.findUnique({
        where: { id },
        select: { dealDate: true, ownershipName: true },
      });

      // Apartment marked SOLD; deal_date/ownership_name may be filled later
    }

    return await prisma.apartment.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  },

  async delete(id: number) {
    await prisma.apartment.delete({
      where: { id },
    });
  },

  /** Get apartment by public landing token (for share link). Returns null if not found. */
  async getByLandingToken(token: string) {
    if (!token?.trim()) return null;
    const apartment = await prisma.apartment.findUnique({
      where: { landingToken: token.trim() },
      select: {
        id: true,
        buildingId: true,
        apartmentNo: true,
        apartmentName: true,
        apartmentType: true,
        floor: true,
        status: true,
        sqm: true,
        priceSqm: true,
        totalPrice: true,
        totalPaid: true,
        dealDate: true,
        ownershipName: true,
        email: true,
        phone: true,
        salesType: true,
        dealDescription: true,
        matterLink: true,
        floorplanDistribution: true,
        exteriorLink: true,
        exteriorLink2: true,
        buyerAddress: true,
        otherBuyers: true,
        paymentSchedule: true,
        balanceRemaining: true,
        notes: true,
        updatedAt: true,
        building: {
          select: {
            id: true,
            name: true,
            slug: true,
            district: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileType: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
      },
    });
    if (!apartment) return null;
    const totalPrice =
      apartment.sqm && apartment.priceSqm
        ? Number(apartment.sqm) * Number(apartment.priceSqm)
        : null;
    const balance =
      totalPrice && apartment.totalPaid
        ? totalPrice - Number(apartment.totalPaid)
        : totalPrice;
    return {
      ...apartment,
      total_price: totalPrice,
      balance,
      sqm: apartment.sqm ? Number(apartment.sqm) : null,
      price_sqm: apartment.priceSqm ? Number(apartment.priceSqm) : null,
      total_paid: apartment.totalPaid ? Number(apartment.totalPaid) : null,
      buyer_address: apartment.buyerAddress,
      other_buyers: apartment.otherBuyers,
      payment_schedule: apartment.paymentSchedule,
      balance_remaining: apartment.balanceRemaining ? Number(apartment.balanceRemaining) : null,
      attachments: apartment.attachments,
      building_name: apartment.building.name,
      building_slug: apartment.building.slug,
      district_id: apartment.building.district.id,
      district_slug: apartment.building.district.slug,
      district_name: apartment.building.district.name,
    };
  },

  async bulkUpdate(items: Array<{ id: number; apartmentNo?: string; apartmentName?: string | null }>) {
    const results = await prisma.$transaction(
      items.map((item) => {
        const data: Prisma.ApartmentUpdateInput = {};
        if (item.apartmentNo !== undefined) {
          data.apartmentNo = item.apartmentNo.trim();
        }
        if (item.apartmentName !== undefined) {
          data.apartmentName = item.apartmentName?.trim() || null;
        }
        return prisma.apartment.update({
          where: { id: item.id },
          data,
          select: { id: true, apartmentNo: true, apartmentName: true },
        });
      })
    );
    return results;
  },

  /** Ensure apartment has a landing token; generate if missing. Returns the token. */
  async ensureLandingToken(id: number): Promise<string | null> {
    const apartment = await prisma.apartment.findUnique({
      where: { id },
      select: { landingToken: true },
    });
    if (!apartment) return null;
    if (apartment.landingToken) return apartment.landingToken;
    const token = crypto.randomBytes(24).toString('base64url');
    await prisma.apartment.update({
      where: { id },
      data: { landingToken: token },
    });
    return token;
  },
};

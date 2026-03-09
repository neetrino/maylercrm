import { prisma } from '@/lib/prisma';
import type { Building } from '@prisma/client';

const buildingInclude = {
  district: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  floorPlans: {
    select: {
      id: true,
      floor: true,
      fileUrl: true,
      fileName: true,
    },
    orderBy: { floor: 'asc' },
  },
};

export const buildingService = {
  async getAll(districtId?: number) {
    return await prisma.building.findMany({
      where: districtId ? { districtId } : undefined,
      include: buildingInclude,
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: number) {
    return await prisma.building.findUnique({
      where: { id },
      include: {
        district: true,
        floorPlans: {
          orderBy: { floor: 'asc' },
        },
      },
    });
  },

  async getBySlug(districtId: number, slug: string): Promise<Building | null> {
    return await prisma.building.findUnique({
      where: {
        districtId_slug: {
          districtId,
          slug,
        },
      },
      include: {
        district: true,
      },
    });
  },

  async create(data: {
    districtId: number;
    name: string;
    slug: string;
  }): Promise<Building> {
    // Проверка существования района
    const district = await prisma.district.findUnique({
      where: { id: data.districtId },
    });

    if (!district) {
      throw new Error('Район не найден');
    }

    // Валидация slug
    const validSlug = data.slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return await prisma.building.create({
      data: {
        districtId: data.districtId,
        name: data.name.trim(),
        slug: validSlug,
      },
      include: {
        district: true,
      },
    });
  },

  async update(
    id: number,
    data: { name?: string; slug?: string; districtId?: number; floorsCount?: number | null }
  ) {
    const updateData: {
      name?: string;
      slug?: string;
      districtId?: number;
      floorsCount?: number | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.slug !== undefined) {
      updateData.slug = data.slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    if (data.districtId !== undefined) {
      const district = await prisma.district.findUnique({
        where: { id: data.districtId },
      });
      if (!district) throw new Error('Район не найден');
      updateData.districtId = data.districtId;
    }

    if (data.floorsCount !== undefined) {
      updateData.floorsCount = data.floorsCount;
    }

    return await prisma.building.update({
      where: { id },
      data: updateData,
      include: {
        district: true,
        floorPlans: { orderBy: { floor: 'asc' } },
      },
    });
  },

  async createFloorPlan(
    buildingId: number,
    floor: number,
    fileUrl: string,
    fileName?: string | null
  ) {
    return await prisma.buildingFloorPlan.upsert({
      where: {
        buildingId_floor: { buildingId, floor },
      },
      create: { buildingId, floor, fileUrl, fileName },
      update: { fileUrl, fileName },
    });
  },

  async deleteFloorPlan(buildingId: number, floor: number) {
    await prisma.buildingFloorPlan.deleteMany({
      where: { buildingId, floor },
    });
  },

  async delete(id: number): Promise<void> {
    // Проверка: нельзя удалить здание, если есть квартиры
    const apartmentsCount = await prisma.apartment.count({
      where: { buildingId: id },
    });

    if (apartmentsCount > 0) {
      throw new Error(
        `Нельзя удалить здание: в нём ${apartmentsCount} квартир. Сначала удалите все квартиры.`
      );
    }

    await prisma.building.delete({
      where: { id },
    });
  },
};

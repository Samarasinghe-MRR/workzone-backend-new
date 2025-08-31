import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryTreeDto,
} from "./dto/category.dto";
import { EventPublisherService } from "../events/event-publisher.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService
  ) {}

  async createCategory(
    data: CreateCategoryDto,
    createdBy?: string
  ): Promise<CategoryResponseDto> {
    // Check if category name already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name '${data.name}' already exists`
      );
    }

    // Validate parent category exists if provided
    if (data.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID '${data.parentId}' not found`
        );
      }

      if (!parentCategory.isActive) {
        throw new BadRequestException(
          "Cannot create subcategory under inactive parent"
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        ...data,
        createdBy,
      },
    });

    // Log audit trail
    await this.logAuditAction(
      "CREATED",
      category.id,
      null,
      category,
      createdBy
    );

    // Publish event
    await this.eventPublisher.publishCategoryCreated({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdBy,
      createdAt: category.createdAt,
    });

    return category;
  }

  async getAllCategories(
    includeInactive = false
  ): Promise<CategoryResponseDto[]> {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.category.findMany({
      where,
      orderBy: [
        { parentId: "asc" }, // Parents first
        { name: "asc" },
      ],
    });
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  async getCategoriesTree(includeInactive = false): Promise<CategoryTreeDto[]> {
    const where = includeInactive ? {} : { isActive: true };

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Build tree structure
    const categoryMap = new Map<string, CategoryTreeDto>();
    const rootCategories: CategoryTreeDto[] = [];

    // First pass: create all category objects
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
      });
    });

    // Second pass: build parent-child relationships
    categories.forEach((cat) => {
      const categoryDto = categoryMap.get(cat.id)!;

      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children!.push(categoryDto);
      } else {
        rootCategories.push(categoryDto);
      }
    });

    return rootCategories;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto,
    updatedBy?: string
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.getCategoryById(id);

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== existingCategory.name) {
      const nameExists = await this.prisma.category.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        throw new ConflictException(
          `Category with name '${data.name}' already exists`
        );
      }
    }

    // Validate parent category if being updated
    if (data.parentId) {
      if (data.parentId === id) {
        throw new BadRequestException("Category cannot be its own parent");
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID '${data.parentId}' not found`
        );
      }

      // Check for circular reference
      if (await this.wouldCreateCircularReference(id, data.parentId)) {
        throw new BadRequestException("Update would create circular reference");
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data,
    });

    // Log audit trail
    await this.logAuditAction(
      "UPDATED",
      id,
      existingCategory,
      updatedCategory,
      updatedBy
    );

    // Publish event
    await this.eventPublisher.publishCategoryUpdated({
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      parentId: updatedCategory.parentId,
      updatedBy,
      updatedAt: updatedCategory.updatedAt,
    });

    return updatedCategory;
  }

  async deleteCategory(id: string, deletedBy?: string): Promise<void> {
    const category = await this.getCategoryById(id);

    // Check if category has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new BadRequestException(
        "Cannot delete category with subcategories. Delete subcategories first."
      );
    }

    // Soft delete by setting isActive to false
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    // Log audit trail
    await this.logAuditAction("DELETED", id, category, null, deletedBy);

    // Publish event
    await this.eventPublisher.publishCategoryDeleted({
      id,
      name: category.name,
      deletedBy,
      deletedAt: new Date(),
    });
  }

  async searchCategories(
    query: string,
    includeInactive = false
  ): Promise<CategoryResponseDto[]> {
    const where: Prisma.CategoryWhereInput = {
      AND: [
        includeInactive ? {} : { isActive: true },
        {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            {
              description: {
                contains: query,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      ],
    };

    return this.prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  private async wouldCreateCircularReference(
    categoryId: string,
    newParentId: string
  ): Promise<boolean> {
    let currentParentId = newParentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = parent?.parentId || null;
    }

    return false;
  }

  private async logAuditAction(
    action: string,
    categoryId: string,
    oldData: any,
    newData: any,
    performedBy?: string
  ): Promise<void> {
    try {
      await this.prisma.categoryAuditLog.create({
        data: {
          categoryId,
          action: action as any,
          oldData: oldData || null,
          newData: newData || null,
          performedBy: performedBy || "system",
        },
      });
    } catch (error) {
      // Log audit failures but don't throw to prevent operation failure
      console.error("Failed to log audit action:", error);
    }
  }
}

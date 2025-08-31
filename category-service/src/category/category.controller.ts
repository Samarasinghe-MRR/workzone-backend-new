import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryTreeDto,
} from "./dto/category.dto";
import { JwtUtilService } from "../common/jwt-util.service";

@ApiTags("Categories")
@Controller("categories")
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly jwtUtil: JwtUtilService
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new category (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Category created successfully",
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 409, description: "Category name already exists" })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Headers("authorization") authHeader?: string
  ) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const userInfo = this.jwtUtil.validateAdminToken(token);

    return this.categoryService.createCategory(
      createCategoryDto,
      userInfo.userId
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all categories" })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: "List of categories",
    type: [CategoryResponseDto],
  })
  async getAllCategories(@Query("includeInactive") includeInactive?: string) {
    const includeInactiveFlag = includeInactive === "true";
    return this.categoryService.getAllCategories(includeInactiveFlag);
  }

  @Get("tree")
  @ApiOperation({ summary: "Get categories in tree structure" })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: "Categories tree structure",
    type: [CategoryTreeDto],
  })
  async getCategoriesTree(@Query("includeInactive") includeInactive?: string) {
    const includeInactiveFlag = includeInactive === "true";
    return this.categoryService.getCategoriesTree(includeInactiveFlag);
  }

  @Get("search")
  @ApiOperation({ summary: "Search categories by name or description" })
  @ApiQuery({ name: "q", description: "Search query" })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: "Search results",
    type: [CategoryResponseDto],
  })
  async searchCategories(
    @Query("q") query: string,
    @Query("includeInactive") includeInactive?: string
  ) {
    const includeInactiveFlag = includeInactive === "true";
    return this.categoryService.searchCategories(query, includeInactiveFlag);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get category by ID" })
  @ApiResponse({
    status: 200,
    description: "Category details",
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: "Category not found" })
  async getCategoryById(@Param("id") id: string) {
    return this.categoryService.getCategoryById(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update category (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Category updated successfully",
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: "Category not found" })
  async updateCategory(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Headers("authorization") authHeader?: string
  ) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const userInfo = this.jwtUtil.validateAdminToken(token);

    return this.categoryService.updateCategory(
      id,
      updateCategoryDto,
      userInfo.userId
    );
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete category (Admin only)" })
  @ApiResponse({ status: 200, description: "Category deleted successfully" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async deleteCategory(
    @Param("id") id: string,
    @Headers("authorization") authHeader?: string
  ) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const userInfo = this.jwtUtil.validateAdminToken(token);

    await this.categoryService.deleteCategory(id, userInfo.userId);
    return { message: "Category deleted successfully" };
  }
}

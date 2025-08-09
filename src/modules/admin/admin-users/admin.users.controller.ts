import { Controller, Delete, Get, Param, Post, UseGuards, Query, HttpStatus, HttpCode } from "@nestjs/common";
import { AdminUsersService } from "./admin.users.service";
import { BasicAuthGuard } from "../../users/guards/basic/basic-auth.guard";
import { GetUsersQueryParams } from "../../users/api/get-users-query-params.input-dto";
import { PaginatedViewDto } from "../../../core/dto/base.paginated.view-dto";
import { UserViewDto } from "../../users/api/view-dto/users.view-dto";
import { CreateUserInputDto } from "../../users/api/input-dto/users.input-dto";
import { Body } from "@nestjs/common";

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams
): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.adminUsersService.getAll(query);
  }

  @Post()   
  async addUser(@Body() body: CreateUserInputDto) {
    return this.adminUsersService.addUser(body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }
}
  
import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { AdminUsersController } from "./admin.users.controller";
import { AdminUsersService } from "./admin.users.service";
import { AdminUsersRepository } from "./admin.users.repository";
import { PostgresService } from "../../core/database/postgres.config";

@Module({
  imports: [UsersModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUsersRepository, PostgresService],
})
export class AdminModule {}
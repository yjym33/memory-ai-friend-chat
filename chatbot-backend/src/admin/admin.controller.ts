import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AuthenticatedRequest } from '../common/types/request.types';
import { UpdateUserTypeDto, UpdateUserStatusDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 관리자 권한 체크
  private checkAdminPermission(req: AuthenticatedRequest) {
    const userRole = req.user?.role;
    if (!userRole || !['super_admin', 'admin'].includes(userRole)) {
      throw new HttpException(
        '관리자 권한이 필요합니다.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  @Get('users')
  async getAllUsers(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('userType') userType?: 'individual' | 'business',
    @Query('role') role?: string,
  ) {
    this.checkAdminPermission(req);

    return this.adminService.getAllUsers({
      page: Number(page),
      limit: Number(limit),
      search,
      userType: userType as any,
      role: role as any,
    });
  }

  @Get('users/:id')
  async getUserById(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.checkAdminPermission(req);
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/type')
  async updateUserType(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserTypeDto: UpdateUserTypeDto,
  ) {
    this.checkAdminPermission(req);

    return this.adminService.updateUserType(
      id,
      updateUserTypeDto,
      req.user.userId,
    );
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    this.checkAdminPermission(req);

    return this.adminService.updateUserStatus(
      id,
      updateUserStatusDto,
      req.user.userId,
    );
  }

  @Post('users/:id/approve-business')
  async approveBusinessMode(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    this.checkAdminPermission(req);

    return this.adminService.approveBusinessMode(id, reason, req.user.userId);
  }

  @Delete('users/:id/revoke-business')
  async revokeBusinessMode(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    this.checkAdminPermission(req);

    return this.adminService.revokeBusinessMode(id, reason, req.user.userId);
  }

  @Get('statistics')
  async getSystemStatistics(@Request() req: AuthenticatedRequest) {
    this.checkAdminPermission(req);
    return this.adminService.getSystemStatistics();
  }

  @Get('organizations')
  async getAllOrganizations(@Request() req: AuthenticatedRequest) {
    this.checkAdminPermission(req);
    return this.adminService.getAllOrganizations();
  }

  @Get('organizations/:id/users')
  async getOrganizationUsers(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ) {
    this.checkAdminPermission(req);
    return this.adminService.getOrganizationUsers(organizationId);
  }
}

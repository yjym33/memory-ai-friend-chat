import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserType, UserRole } from '../auth/entity/user.entity';
import { Organization } from '../auth/entity/organization.entity';
import {
  UpdateUserTypeDto,
  UpdateUserStatusDto,
  GetUsersQueryDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async getAllUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 20, search, userType, role } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.userType',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
        'user.businessProfile',
        'organization.id',
        'organization.name',
        'organization.type',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // 검색 조건 추가
    if (search) {
      queryBuilder.where(
        'user.email ILIKE :search OR user.name ILIKE :search',
        { search: `%${search}%` },
      );
    }

    if (userType) {
      queryBuilder.andWhere('user.userType = :userType', { userType });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async updateUserType(
    userId: string,
    updateUserTypeDto: UpdateUserTypeDto,
    adminId: string,
  ) {
    const user = await this.getUserById(userId);
    const { userType, role, organizationId, reason } = updateUserTypeDto;

    // 기업 사용자로 변경하는 경우 조직이 필요
    if (
      userType === UserType.BUSINESS &&
      !organizationId &&
      !user.organizationId
    ) {
      throw new BadRequestException('기업 사용자는 조직이 필요합니다.');
    }

    // 조직 존재 확인
    if (organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: organizationId },
      });
      if (!organization) {
        throw new NotFoundException('조직을 찾을 수 없습니다.');
      }
    }

    // 사용자 정보 업데이트
    user.userType = userType;
    if (role) {
      user.role = role;
    }
    if (organizationId) {
      user.organizationId = organizationId;
    }

    // 기업 사용자로 변경하는 경우 비즈니스 프로필 업데이트
    if (userType === UserType.BUSINESS) {
      const businessProfile = user.businessProfile || {};
      user.businessProfile = {
        ...businessProfile,
        businessModeApproved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalReason: reason || '관리자에 의한 수동 승인',
      };
    } else {
      // 개인 사용자로 변경하는 경우 비즈니스 승인 취소
      const businessProfile = user.businessProfile || {};
      user.businessProfile = {
        ...businessProfile,
        businessModeApproved: false,
        revokedBy: adminId,
        revokedAt: new Date(),
        revokeReason: reason || '관리자에 의한 개인 사용자 전환',
      };
      user.organizationId = undefined;
    }

    await this.userRepository.save(user);

    return {
      message: `사용자 유형이 ${userType === UserType.BUSINESS ? '기업' : '개인'} 사용자로 변경되었습니다.`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        role: user.role,
        organizationId: user.organizationId,
        businessProfile: user.businessProfile,
      },
    };
  }

  async updateUserStatus(
    userId: string,
    updateUserStatusDto: UpdateUserStatusDto,
    adminId: string,
  ) {
    const user = await this.getUserById(userId);
    const { isActive, reason } = updateUserStatusDto;

    // 사용자 상태 업데이트 (실제로는 isActive 컬럼이 없으므로 businessProfile에 저장)
    const businessProfile = user.businessProfile || {};
    user.businessProfile = {
      ...businessProfile,
      isActive: isActive !== undefined ? isActive : true,
      statusChangedBy: adminId,
      statusChangedAt: new Date(),
      statusChangeReason: reason || '관리자에 의한 상태 변경',
    };

    await this.userRepository.save(user);

    return {
      message: `사용자 상태가 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive,
      },
    };
  }

  async approveBusinessMode(userId: string, reason: string, adminId: string) {
    const user = await this.getUserById(userId);

    const businessProfile = user.businessProfile || {};
    user.businessProfile = {
      ...businessProfile,
      businessModeApproved: true,
      approvedBy: adminId,
      approvedAt: new Date(),
      approvalReason: reason || '관리자 승인',
    };

    await this.userRepository.save(user);

    return {
      message: '기업 모드가 승인되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessModeApproved: true,
      },
    };
  }

  async revokeBusinessMode(userId: string, reason: string, adminId: string) {
    const user = await this.getUserById(userId);

    const businessProfile = user.businessProfile || {};
    user.businessProfile = {
      ...businessProfile,
      businessModeApproved: false,
      revokedBy: adminId,
      revokedAt: new Date(),
      revokeReason: reason || '관리자에 의한 승인 취소',
    };

    await this.userRepository.save(user);

    return {
      message: '기업 모드 승인이 취소되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessModeApproved: false,
      },
    };
  }

  async getSystemStatistics() {
    const totalUsers = await this.userRepository.count();
    const individualUsers = await this.userRepository.count({
      where: { userType: UserType.INDIVIDUAL },
    });
    const businessUsers = await this.userRepository.count({
      where: { userType: UserType.BUSINESS },
    });
    const totalOrganizations = await this.organizationRepository.count();

    // 최근 가입자 (7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    return {
      totalUsers,
      individualUsers,
      businessUsers,
      totalOrganizations,
      recentUsers,
      userTypeDistribution: {
        individual: Math.round((individualUsers / totalUsers) * 100),
        business: Math.round((businessUsers / totalUsers) * 100),
      },
    };
  }

  async getAllOrganizations() {
    return this.organizationRepository.find({
      relations: ['users'],
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        subscriptionTier: true,
        domain: true,
        createdAt: true,
        users: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    });
  }

  async getOrganizationUsers(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException('조직을 찾을 수 없습니다.');
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        subscriptionTier: organization.subscriptionTier,
      },
      users: organization.users,
    };
  }
}

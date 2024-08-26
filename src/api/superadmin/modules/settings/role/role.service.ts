import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../../common/interface';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import {
  superAdminPermissions,
  superadminPermissionNames,
} from 'src/api/superadmin/common/constants/route-permissions';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: SuperAdminActivityService,
  ) {}

  async create(data: CreateParams<CreateRoleDto>) {
    const { postData, loggedUserData } = data;
    const { name, permissions } = postData;

    const alreadyExist = await this.prisma.superAdminRole.findFirst({
      where: {
        name,
      },
    });

    if (alreadyExist) throw new ConflictException('Role already exists');

    const role = await this.prisma.superAdminRole.create({
      data: {
        name,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
        permissions: {
          createMany: {
            data: permissions.map((permission) => ({
              name: permission.name,
              access: permission.access,
              children: permission.children,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Created multiple roles',
      type: 'auth',
    });

    return role;
  }

  async getRolesConstants() {
    const rolesConstant = superadminPermissionNames.map((permission) => {
      return {
        name: permission,
        children: superAdminPermissions[permission],
      };
    });

    return rolesConstant;
  }

  async getAll(data: GetAllParams) {
    const { archive } = data;

    const roles = await this.prisma.superAdminRole.findMany({
      where: {
        archive,
      },
      select: {
        id: true,
        name: true,
        archive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            id: true,
            name: true,
            access: true,
            children: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    return roles.slice(0, roles.length - 1);
  }

  async getDetails(data: GetParam) {
    const { id } = data;
    const role = await this.prisma.superAdminRole.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        archive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            id: true,
            name: true,
            access: true,
            children: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    return role;
  }

  async update(data: UpdateParams<UpdateRoleDto>) {
    const { id, postData, loggedUserData } = data;

    const role = await this.prisma.superAdminRole.findUnique({
      where: {
        id,
      },
    });

    if (!role) throw new ConflictException('Role not found');

    const firstRole = await this.prisma.superAdminRole.findFirst({
      where: {
        users: {
          some: {
            email: loggedUserData.email,
          },
        },
      },
    });

    if (role.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const updatedRole = await this.prisma.superAdminRole.update({
      where: {
        id,
      },
      data: {
        name: postData.name,
        updatedById: loggedUserData.id,
        permissions: {
          deleteMany: {},
          createMany: {
            data: postData.permissions.map((permission) => ({
              name: permission.name,
              access: permission.access,
              children: permission.children,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Updated role',
      type: 'auth',
    });

    return updatedRole;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const validRole = await this.prisma.superAdminRole.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        archive: true,
        users: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    const firstRole = await this.prisma.superAdminRole.findFirst({
      where: {
        users: {
          some: {
            email: loggedUserData.email,
          },
        },
      },
    });

    if (validRole.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const ownRole = validRole.users.find((i) => i.id === loggedUserData.id);

    if (ownRole) throw new ForbiddenException('Cannot archive your own role');

    const role = await this.prisma.superAdminRole.update({
      where: {
        id,
      },
      data: {
        archive: !validRole.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `${validRole.archive ? 'Restored' : 'Archived'} the role`,
      type: 'auth',
    });

    return role;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const validRole = await this.prisma.superAdminRole.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        archive: true,
        users: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    const firstRole = await this.prisma.superAdminRole.findFirst({
      where: {
        users: {
          some: {
            email: loggedUserData.email,
          },
        },
      },
    });

    if (validRole.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const ownRole = validRole.users.find((i) => i.id === loggedUserData.id);

    if (ownRole) throw new ForbiddenException('Cannot delete your own role');

    await this.prisma.superAdminRole.delete({
      where: {
        id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Deleted the role`,
      type: 'auth',
    });
  }
}

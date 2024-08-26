import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createUserDto } from './dto/create-user.dto';
import bcrypt from 'bcryptjs';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { FileService } from 'src/global/file/file.service';
import { updateUserDto } from './dto/update-user.dto';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { EnvService } from 'src/global/env/env.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly activity: SuperAdminActivityService,
    private readonly envService: EnvService,
  ) { }

  async create(data: CreateParams<createUserDto>) {
    const { cpassword, name, email, ...postData } = data.postData;
    const { loggedUserData } = data;

    const validRole = await this.prisma.superAdminRole.findFirst({
      where: {
        id: postData.roleId,
        archive: false,
      },
    });

    if (!validRole) throw new BadRequestException('Invalid Role Id');

    const alreadyExist = await this.prisma.superAdmin.findUnique({
      where: {
        email,
      },
    });

    if (alreadyExist) throw new BadRequestException('Email already exist');

    if (postData.password !== cpassword)
      throw new BadRequestException('Password are not same');

    const password = bcrypt.hashSync(postData.password, 10);

    const user = await this.prisma.superAdmin.create({
      data: {
        ...postData,
        name,
        email,
        password,
        roleId: validRole.id,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Created the user ${user.name}`,
      type: 'setting',
    });

    return user;
  }

  async getAllRoles() {
    return await this.prisma.superAdminRole.findMany({
      where: {
        archive: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getAll(data: GetAllParams) {
    const { archive } = data;

    const users = await this.prisma.superAdmin.findMany({
      where: {
        archive,
      },
      orderBy: {
        createdById: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        contact: true,
        dob: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        image: {
          select: {
            url: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const userwithsuperadminstatus = users.map((user) => {
      if (user.email === this.envService.get('SUPERADMIN_EMAIL')) {
        return {
          ...user,
          superadmin: true,
        };
      } else {
        return {
          ...user,
          superadmin: false,
        };
      }
    });

    return userwithsuperadminstatus;
  }

  async getSingle(data: GetParam) {
    const { id } = data;

    const users = await this.prisma.superAdmin.findMany({
      where: {
        id,
      },
      orderBy: {
        createdById: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        contact: true,
        dob: true,
        archive: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        image: {
          select: {
            url: true,
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
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
        updatedBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return users;
  }

  async update(data: UpdateParams<updateUserDto>) {
    const { id, postData, loggedUserData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exist');

    const { roleId } = postData;

    // main user
    const mainadmin = await this.prisma.superAdmin.findUnique({
      where: {
        email: this.envService.get('SUPERADMIN_EMAIL'),
      },
    });

    const isSuperadmin = validUser.id === mainadmin?.id;

    if (isSuperadmin && loggedUserData.id !== mainadmin.id) {
      throw new ForbiddenException(
        'Only the superadmin can update their own profile',
      );
    }

    if (roleId) {
      const validRole = await this.prisma.superAdminRole.findUnique({
        where: {
          id: roleId,
          archive: false,
        },
      });

      if (!validRole) throw new BadRequestException('Invalid Role Id');
    }

    const user = await this.prisma.superAdmin.update({
      where: {
        id,
      },
      data: {
        ...postData,
        updatedById: loggedUserData.id,
        roleId: !isSuperadmin ? roleId : undefined, // main admin cannot change their role
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Updated the user ${user.name}`,
      type: 'setting',
    });

    return user;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, postData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
      select: {
        image: true,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: 'image',
      existedFile: validUser.image ? validUser.image : undefined,
    });

    const profile = await this.prisma.superAdmin.update({
      where: {
        id,
      },
      data: {
        image: {
          connect: file,
        },
      },
      select: {
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return profile;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (validUser.id === loggedUserData.id)
      throw new ForbiddenException('Cannot archive your own account');

    if (validUser.email === this.envService.get('SUPERADMIN_EMAIL')) {
      throw new ForbiddenException('Cannot archive the superadmin account');
    }

    const user = await this.prisma.superAdmin.update({
      where: {
        id,
      },
      data: {
        archive: !validUser.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `${validUser.archive ? 'Restored' : 'Archived'} the user ${validUser.name}`,
      type: 'setting',
    });

    return user;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (validUser.id === loggedUserData.id)
      throw new ForbiddenException('Cannot delete your own account');

    if (validUser.email === this.envService.get('SUPERADMIN_EMAIL')) {
      throw new ForbiddenException('Cannot archive the superadmin account');
    }

    await this.prisma.superAdmin.delete({
      where: {
        id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Deleted the user ${validUser.name}`,
      type: 'setting',
    });
  }
}

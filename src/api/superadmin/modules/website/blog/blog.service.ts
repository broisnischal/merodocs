import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createBlogDto } from './dtos/create-blog.dto';
import {
  CreateParams,
  UpdateParams,
  DeleteParams,
  GetParam,
  GetAllParams,
} from 'src/api/superadmin/common/interface';
import { BlogStatusEnum, Prisma } from '@prisma/client';
import { updateBlogDto } from './dtos/update-blog.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import moment from 'moment';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<
      createBlogDto & {
        file: Express.Multer.File;
      }
    >,
  ) {
    const { postData, loggedUserData } = data;

    const { categoryId, status, tags, publishDate, slug } = postData;

    const alreadyExist = await this.prisma.blog.findUnique({ where: { slug } });

    if (alreadyExist)
      throw new ConflictException('Blog with same slug already exists');

    const [existingBlog, category, validTags] = await Promise.all([
      this.prisma.blog.findUnique({ where: { slug } }),
      this.prisma.blogCategory.findUnique({ where: { id: categoryId } }),
      this.prisma.blogTag.findMany({ where: { id: { in: tags } } }),
    ]);

    if (existingBlog) throw new ConflictException('Same Blog already exists');
    if (!category) throw new NotFoundException('Category does not exist');
    if (!tags || validTags.length !== tags.length)
      throw new BadRequestException('Invalid tags id passed');

    const { validStatus, finalPublishDate } =
      this.determineStatusAndPublishDate(status, publishDate);

    let cover: string | undefined;

    const { file, ...rest } = data.postData;

    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(
        postData.file,
      );

      if (uploaded.url) cover = uploaded.url;
    }

    const blog = await this.prisma.blog.create({
      data: {
        ...rest,
        slug,
        status: validStatus,
        publishDate: finalPublishDate,
        tags: {
          connect: validTags.map((tag) => ({ id: tag.id })),
        },
        cover,
        categoryId: category.id,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    return blog;
  }

  async update(
    data: UpdateParams<
      updateBlogDto & {
        file?: Express.Multer.File;
      }
    >,
  ) {
    const { postData, loggedUserData, id } = data;
    const {
      categoryId,
      title,
      slug,
      tags,
      status: newStatus,
      publishDate: newPublishDate,
      description,
      content,
    } = postData;

    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingBlog) throw new NotFoundException('Blog does not exist');

    const updatedData: Prisma.BlogUpdateInput = {
      updatedBy: { connect: { id: loggedUserData.id } },
    };

    if (title) updatedData.title = title;

    if (slug && slug !== existingBlog.slug) {
      const alreadyExist = await this.prisma.blog.findUnique({
        where: { slug },
      });

      if (alreadyExist)
        throw new ConflictException('Blog with same slug already exists');

      updatedData.slug = slug;
    }

    if (description) updatedData.description = description;
    if (content) updatedData.content = content;

    if (categoryId) {
      const validCategory = await this.prisma.blogCategory.findUnique({
        where: { id: categoryId },
      });
      if (!validCategory)
        throw new NotFoundException('Invalid Blog Category Id');
      updatedData.category = { connect: { id: categoryId } };
    }

    if (tags) {
      const validTags = await this.prisma.blogTag.findMany({
        where: { id: { in: tags } },
      });

      if (validTags.length !== tags.length)
        throw new BadRequestException('Invalid Blog Tags Ids passed');

      updatedData.tags = { set: validTags.map((tag) => ({ id: tag.id })) };
    }

    const { status, publishDate } = this.determineStatusAndPublishDateForUpdate(
      existingBlog.status,
      newStatus,
      newPublishDate,
    );

    if (status) updatedData.status = status;
    if (publishDate) updatedData.publishDate = publishDate.toISOString();

    if (postData.file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(
        postData.file,
      );

      if (existingBlog.cover)
        await this.awsService.deleteFromS3(existingBlog.cover);

      updatedData.cover = uploaded.url;
    }

    return this.prisma.blog.update({
      where: { id },
      data: updatedData,
      include: { tags: true },
    });
  }

  async get(
    data: GetAllParams & {
      featured?: string;
    },
  ) {
    const { archive, filter, page, limit, featured, q } = data;

    let where: Prisma.BlogWhereInput;

    if (archive) {
      where = { archive: true };
    } else {
      where = { archive: false };
    }

    if (q) {
      where = { ...where, title: { search: q, mode: 'insensitive' } };
    }

    if (featured === 'true') {
      where = { featured: archive ? false : true };
    } else if (featured === 'false') {
      where = { featured: archive ? undefined : false };
    }

    if (!where.archive) {
      switch (filter) {
        case BlogStatusEnum.published: {
          where = { ...where, status: BlogStatusEnum.published };
          break;
        }
        case BlogStatusEnum.draft: {
          where = { ...where, status: BlogStatusEnum.draft };
          break;
        }
        case BlogStatusEnum.scheduled: {
          where = { ...where, status: BlogStatusEnum.scheduled };
          break;
        }
      }
    }

    const blogs = await this.prisma.blog.getAllPaginated(
      {
        limit,
        page,
      },
      {
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: {
              id: true,
              title: true,
            },
          },
          archive: true,
          featured: true,
          publishDate: true,
          status: true,
          createdBy: {
            select: {
              name: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          createdAt: true,
          updatedBy: {
            select: {
              name: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          updatedAt: true,
        },
      },
    );

    return blogs;
  }

  async getSingle(data: GetParam) {
    const { id } = data;

    const valid = await this.prisma.blog.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        content: true,
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        tags: {
          select: {
            id: true,
            title: true,
          },
        },
        featured: true,
        cover: true,
        status: true,
        publishDate: true,
        createdBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedAt: true,
      },
    });

    if (!valid) throw new BadRequestException('Blog does not exist');

    return valid;
  }

  async featureBlog(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const validBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!validBlog) throw new NotFoundException('Blog does not exist');

    if (validBlog.status !== BlogStatusEnum.published) {
      throw new BadRequestException(
        'Blog cannot be featured when it is not published',
      );
    }

    if (!validBlog.featured) {
      const featuredBlogsCount = await this.prisma.blog.count({
        where: { featured: true },
      });

      if (featuredBlogsCount >= 4) {
        throw new BadRequestException(
          'Featured blogs number already reached limit! Only 4 allowed',
        );
      }
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        featured: !validBlog.featured,
        updatedById: loggedUserData.id,
      },
    });
  }

  async archive(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const validBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!validBlog) throw new NotFoundException('Blog does not exist');

    return this.prisma.blog.update({
      where: { id },
      data: {
        archive: !validBlog.archive,
        featured: validBlog.archive ? undefined : false,
        updatedById: loggedUserData.id,
      },
    });
  }

  async deleteBlog(data: DeleteParams) {
    const { id } = data;

    const validBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!validBlog) throw new NotFoundException('Blog does not exist');

    await this.prisma.blog.delete({
      where: { id },
    });
  }

  async publishBlog(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const validBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!validBlog) throw new NotFoundException('Blog does not exist');

    if (validBlog.status === BlogStatusEnum.published) {
      throw new BadRequestException('Blog already published');
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        status: BlogStatusEnum.published,
        publishDate: new Date(),
        updatedById: loggedUserData.id,
      },
    });
  }

  async uploadImage(data: { postData: { image: Express.Multer.File } }) {
    if (!data.postData.image) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = await this.awsService.uploadToS3WithSameFormat(
      data.postData.image,
    );

    return { imageUrl };
  }

  async deleteImage(data: { url: string }) {
    if (!data.url) throw new BadRequestException('Image url is required');

    console.log(data.url);

    const imageUrl = await this.awsService.deleteFromS3(data.url);

    return { imageUrl };
  }

  private determineStatusAndPublishDate(
    status: BlogStatusEnum,
    publishDate?: string,
  ): { validStatus: BlogStatusEnum; finalPublishDate?: Date } {
    const now = new Date();

    if (!publishDate) {
      return {
        validStatus:
          status === BlogStatusEnum.draft
            ? BlogStatusEnum.draft
            : BlogStatusEnum.published,
        finalPublishDate: status === BlogStatusEnum.draft ? undefined : now,
      };
    }

    const date = moment(publishDate);
    const nowDate = moment();

    if (date.isBefore(nowDate, 'date'))
      throw new BadRequestException('Publish Date cannot be in the past');

    if (date.isSame(nowDate, 'date')) {
      return {
        validStatus:
          status === BlogStatusEnum.draft
            ? BlogStatusEnum.draft
            : BlogStatusEnum.published,
        finalPublishDate: now,
      };
    }

    return {
      validStatus: BlogStatusEnum.scheduled,
      finalPublishDate: date.toDate(),
    };

    // const date = new Date(publishDate);
    // if (isNaN(date.getTime()))
    //   throw new BadRequestException('Invalid Date Sent');

    // if (date < now)
    //   throw new BadRequestException('Publish Date cannot be in the past');

    // if (Math.abs(date.getTime() - now.getTime()) < 20000) {
    //   return {
    //     validStatus:
    //       status === BlogStatusEnum.draft
    //         ? BlogStatusEnum.draft
    //         : BlogStatusEnum.published,
    //     finalPublishDate: now,
    //   };
    // }

    // return {
    //   validStatus: BlogStatusEnum.scheduled,
    //   finalPublishDate: date,
    // };
  }

  private determineStatusAndPublishDateForUpdate(
    currentStatus: BlogStatusEnum,
    newStatus?: BlogStatusEnum,
    newPublishDate?: string,
  ): { status?: BlogStatusEnum; publishDate?: Date } {
    const now = new Date();

    if (currentStatus === BlogStatusEnum.published) {
      if (newStatus && newStatus !== BlogStatusEnum.published) {
        throw new BadRequestException(
          'Published blog cannot be updated to draft or scheduled',
        );
      }
      return {};
    }

    if (!newStatus) return {};

    if (newStatus === BlogStatusEnum.draft) {
      return { status: BlogStatusEnum.draft };
    }

    if (!newPublishDate) {
      return { status: BlogStatusEnum.published, publishDate: now };
    }

    const publishDate = new Date(newPublishDate);
    if (isNaN(publishDate.getTime()))
      throw new BadRequestException('Invalid Publish Date Passed');

    if (publishDate < now)
      throw new BadRequestException('Publish Date cannot be past date');

    if (Math.abs(publishDate.getTime() - now.getTime()) < 20000) {
      return { status: BlogStatusEnum.published, publishDate: now };
    }

    return { status: BlogStatusEnum.scheduled, publishDate };
  }
}

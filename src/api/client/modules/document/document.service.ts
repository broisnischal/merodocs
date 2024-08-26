import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import { FileService } from 'src/global/file/file.service';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly awsService: AWSStorageService,
  ) {}

  async getDocumentType({ user }: AssignedUserParam.GetAll) {
    const data = await this.prisma.documentType.findMany({
      where: {
        apartmentId: user.apartmentId,
        name: {
          not: 'move-out',
        },
        archive: false,
        atSignUp: true,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const result = Promise.all(
      data.map(async (item) => {
        const count = await this.prisma.documentFileClient.count({
          where: {
            apartmentId: user.apartmentId,
            documentTypeId: item.id,
            uploadedForId: user.id,
          },
        });

        return {
          ...item,
          count,
        };
      }),
    );

    return result;
  }

  async getDocumentsFromType({ user, id }: AssignedUserParam.Get) {
    const valid = await this.prisma.documentType.findFirst({
      where: {
        id,
        atSignUp: true,
        archive: false,
      },
    });

    if (!valid) {
      throw new BadRequestException('Document type not found');
    }

    const userDocuments = await this.prisma.documentFileClient.findMany({
      where: {
        uploadedForId: user.id,
        documentType: {
          archive: false,
          name: {
            not: 'move-out',
          },
          id,
        },
      },
      select: {
        id: true,
        name: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return userDocuments;
  }

  async uploadDocument({
    user,
    body: { file, documentTypeId },
  }: AssignedUserParam.Create<{
    file: Express.Multer.File;
    documentTypeId: string;
  }>) {
    const valid = await this.prisma.documentType.findFirst({
      where: {
        id: documentTypeId,
        atSignUp: true,
        archive: false,
      },
    });

    if (!valid) {
      throw new BadRequestException('Document type not found');
    }

    const userDetail = await this.prisma.apartmentClientUser.findFirst({
      where: {
        flatId: user.flatId,
        clientUserId: user.id,
        status: 'approved',
      },
    });

    if (!userDetail) {
      throw new NotFoundException('Document not found');
    }

    const uploaded = await this.fileService.createRequestClientDocument({
      file,
      clientUserId: user.id,
      documentTypeId: documentTypeId,
      requestId: userDetail.id,
      apartmentId: user.apartmentId,
    });

    return uploaded;
  }

  async deleteDocument({ user, id }: AssignedUserParam.Delete) {
    const file = await this.prisma.documentFileClient.findFirst({
      where: {
        id,
        uploadedForId: user.id,
      },
    });

    if (!file) {
      throw new NotFoundException('Document not found');
    }
    await this.awsService.deleteFromS3(file.url);

    await this.prisma.documentFileClient.delete({
      where: { id },
    });

    return file;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AWSStorageService } from '../aws/aws.service';
import { File, FileTypeEnum, FolderTypeEnum } from '@prisma/client';

interface FileInputProps {
  file: Express.Multer.File;
  name?: string;
  type: FileTypeEnum;
  existedFile?: File;
  folderId?: string;
  documentId?: string;
  createdById?: string;
  clientUserId?: string;
  documentTypeId?: string;
}

interface FileUpdateInputProps {
  file: Express.Multer.File;
  name?: string;
  type: FileTypeEnum;
  existedFile: File;
  folderId?: string;
}

interface DocumentInputProps {
  files: Express.Multer.File[];
  name?: string;
  uploadedForId?: string;
  settingId?: string;
}

interface DocumentClientInputProps {
  file: MainFile;
  requestId: string;
  clientUserId: string;
  documentTypeId: string;
  apartmentId?: string;
}

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async createOrUpdate(props: FileInputProps) {
    //? if props existedFile exists: should update the file
    if (props.existedFile) {
      return await this.update({
        ...props,
        existedFile: props.existedFile,
      });
    }

    //? if props existedFile null: should create the file
    return await this.create(props);
  }

  async create(props: FileInputProps) {
    const { url, name } = await this.awsService.uploadToS3(props.file);

    const file = await this.prisma.file.create({
      data: {
        url,
        type: props.type,
        name: props.name ? props.name : name,
        folderId: props.folderId,
        createdById: props.createdById,
        documentTypeId: props.documentTypeId,
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });
    return file;
  }

  async update(props: FileUpdateInputProps) {
    await this.awsService.deleteFromS3(props.existedFile.url);

    const { url } = await this.awsService.uploadToS3(props.file);

    const file = await this.prisma.file.update({
      where: {
        id: props.existedFile.id,
      },
      data: {
        url,
        name: props.name,
        folderId: props.folderId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return file;
  }

  async delete(id: string) {
    const file = await this.prisma.file.findUnique({
      where: {
        id,
      },
    });

    if (!file) throw new NotFoundException('File not found');

    const del = await this.prisma.file.delete({
      where: {
        id,
      },
    });

    await this.awsService.deleteFromS3(file.url);

    return del;
  }

  async createMultiple({
    files,
    type,
    parentId,
    parentType,
    createdById,
  }: {
    files: Express.Multer.File[];
    type: FolderTypeEnum;
    parentId: string;
    parentType: 'feedback' | 'folder' | 'problem' | 'notice';
    createdById: string;
  }) {
    const uploads = await this.awsService.uploadMultipleToS3(files);

    const newFiles = await this.prisma.file.createMany({
      data: uploads.map((item) => ({
        name: item.name,
        url: item.url,
        type: type === 'document' ? 'docs' : 'image',
        folderId: parentType === 'folder' ? parentId : undefined,
        feedbackId: parentType === 'feedback' ? parentId : undefined,
        problemId: parentType === 'problem' ? parentId : undefined,
        noticeId: parentType === 'notice' ? parentId : undefined,
        createdById,
      })),
    });

    return newFiles;
  }

  async deleteMultiple(files: File[]) {
    await this.awsService.deleteMultipleFromS3(files.map((item) => item.url));

    await this.prisma.file.deleteMany({
      where: {
        id: {
          in: files.map((item) => item.id),
        },
      },
    });
  }

  async createDocumentFile(props: DocumentInputProps) {
    const uploads = await this.awsService.uploadMultipleToS3(props.files);

    const file = await this.prisma.documentFile.createMany({
      data: uploads.map((item) => ({
        url: item.url,
        name: item.name,
        documentSettingId: props.settingId,
        uploadedForId: props.uploadedForId,
      })),
    });

    return file;
  }

  async createRequestClientDocument(value: DocumentClientInputProps) {
    const fileUpload = await this.create({
      file: value.file,
      name: value.file.originalname,
      type: 'docs',
      documentTypeId: value.documentTypeId,
    });

    const fileClient = await this.prisma.documentFileClient.create({
      data: {
        url: fileUpload.url,
        name: fileUpload.name,
        documentTypeId: value.documentTypeId,
        uploadedForId: value.clientUserId,
        apartmentId: value.apartmentId,
        clientRequestId: value.requestId,
        ...(value.apartmentId && { apartmentId: value.apartmentId }),
      },
    });

    await this.prisma.apartmentClientUser.update({
      where: {
        id: value.requestId,
      },
      data: {
        documents: {
          connect: {
            id: fileUpload.id,
          },
        },
      },
    });

    await this.prisma.file.update({
      where: {
        id: fileUpload.id,
      },
      data: {
        documentFileClient: {
          connect: {
            id: fileClient.id,
          },
        },
      },
    });

    return fileUpload;
  }

  async deleteDocumentFile(id: string) {
    const file = await this.prisma.documentFile.findUnique({
      where: {
        id,
      },
    });

    if (!file) throw new NotFoundException('File not found');

    const del = await this.prisma.documentFile.delete({
      where: {
        id,
      },
    });

    await this.awsService.deleteFromS3(file.url);

    return del;
  }
}

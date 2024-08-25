import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ConflictException,
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const pngConversion = ['image/png', 'image/svg+xml', 'image/gif', 'image/svg'];

@Injectable()
export class AWSStorageService {
  private readonly logger = new ConsoleLogger(AWSStorageService.name);
  private readonly S3: S3Client;
  private readonly BUCKET: string;

  constructor(private readonly envService: EnvService) {
    this.S3 = new S3Client({
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
      },
      region: this.envService.get('AWS_REGION'),
    });
    this.BUCKET = this.envService.get('AWS_BUCKET');

    this.logger.log('AWS Storage initialized....');
  }

  async uploadToS3(file: Express.Multer.File) {
    let compressedFile: Buffer;
    let ext: string;

    const splitingName = file.originalname.split('.');
    ext = splitingName.pop() as string;

    const isImage = this.checkIfFileIsImage(file);

    if (isImage) {
      try {
        compressedFile = await this.processImage(file.buffer);
        ext = 'jpg';
      } catch (error) {
        compressedFile = file.buffer;
      }
    } else {
      compressedFile = file.buffer;
    }

    const key = Date.now() + '-' + uuidv4() + '.' + ext;

    const command = new PutObjectCommand({
      Bucket: this.BUCKET,
      Key: key,
      Body: compressedFile,
      ContentType: file.mimetype,
    });

    const url = this.envService.get('CLOUDFRONT') + key;

    try {
      await this.S3.send(command);

      return {
        name: file.originalname.toLowerCase(),
        url,
      };
    } catch (err) {
      this.logger.error('Error while uploading the file', err);
      throw new ConflictException('Error while uploading the file');
    }
  }

  async uploadToS3WithSameFormat(file: Express.Multer.File) {
    let compressedFile: Buffer;
    let ext: string;

    const splitingName = file.originalname.split('.');
    ext = splitingName.pop() as string;

    const isImage = this.checkIfFileIsImage(file);

    if (isImage) {
      try {
        compressedFile = await this.processImage(file.buffer);
        ext = pngConversion.includes(file.mimetype) ? 'png' : ext;
      } catch (error) {
        compressedFile = file.buffer;
      }
    } else {
      compressedFile = file.buffer;
    }

    const key = Date.now() + '-' + uuidv4() + '.' + ext;

    const command = new PutObjectCommand({
      Bucket: this.BUCKET,
      Key: key,
      Body: compressedFile,
      ContentType: file.mimetype,
    });

    const url = this.envService.get('CLOUDFRONT') + key;

    try {
      await this.S3.send(command);
      return {
        name: file.originalname.toLowerCase(),
        url,
      };
    } catch (err) {
      this.logger.error('Error while uploading the file', err);
      throw new ConflictException('Error while uploading the file');
    }
  }

  async uploadMultipleToS3(files: Express.Multer.File[]) {
    let compressedFiles: {
      buffer: Buffer;
      mimetype: string;
      key: string;
      name: string;
    }[] = [];
    let uploadedFiles: { name: string; url: string; mimetype: string }[] = [];

    try {
      await Promise.all(
        files.map(async (item) => {
          const splitingName = item.originalname.toLowerCase().split('.');
          let ext = splitingName.pop();

          let compressedFile: Buffer;

          const isImage = this.checkIfFileIsImage(item);
          if (isImage) {
            try {
              compressedFile = await this.processImage(item.buffer);

              ext = 'jpg';
            } catch (error) {
              compressedFile = item.buffer;
            }
          } else {
            compressedFile = item.buffer;
          }

          const key = Date.now() + '-' + uuidv4() + '.' + ext;

          compressedFiles.push({
            buffer: compressedFile,
            mimetype: item.mimetype,
            key,
            name: item.originalname.toLowerCase(),
          });
        }),
      );

      await Promise.all(
        compressedFiles.map(async (item) => {
          const command = new PutObjectCommand({
            Bucket: this.BUCKET,
            Key: item.key,
            Body: item.buffer,
            ContentType: item.mimetype,
          });

          await this.S3.send(command);

          uploadedFiles.push({
            name: item.name,
            url: this.envService.get('CLOUDFRONT') + item.key,
            mimetype: item.mimetype,
          });
        }),
      );

      return uploadedFiles;
    } catch (error) {
      this.logger.error('Error while uploading multiple files', error);

      if (uploadedFiles.length !== 0) {
        this.deleteMultipleFromS3(uploadedFiles.map((item) => item.url));
      }

      throw new InternalServerErrorException("Couldn't upload the files");
    }
  }

  async deleteFromS3(url: string) {
    const key = url
      .split(/(\\|\/)/g)
      .pop()
      ?.trim();

    if (key === 'null' || key === '') return;

    const command = new DeleteObjectCommand({
      Bucket: this.BUCKET,
      Key: key,
    });

    try {
      await this.S3.send(command);
    } catch (err) {
      this.logger.error('Error while deleting the file', err);
    }
  }

  async deleteMultipleFromS3(urls: string[]) {
    const objects = urls.map((item) => {
      const key = item
        .split(/(\\|\/)/g)
        .pop()
        ?.trim();

      return {
        Key: key === 'null' || key === '' || key === null ? '' : key,
      };
    });

    const filteredObjects = objects.filter((item) => item.Key !== '');

    if (filteredObjects.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.BUCKET,
      Delete: {
        Objects: filteredObjects,
      },
    });

    try {
      await this.S3.send(command);
    } catch (err) {
      this.logger.error('Error while deleting the file', err);
    }
  }

  private checkIfFileIsImage(file: Express.Multer.File) {
    return file.mimetype.includes('image/');
  }

  // private convertType(type: string) {
  //   return type === 'gif' || type === 'svg' || type === 'png' ? 'png' : 'jpg';
  // }

  private async processImage(inputBuffer: Buffer) {
    const metadata = await sharp(inputBuffer).metadata();

    let processor = sharp(inputBuffer)
      .resize(1920) //? Best for Image Compression: resizing the resolution with only height parameter for maintaining the aspect ratio
      .sharpen() //? Best for Image Compression: sharpening the image
      .toFormat('jpg', {
        quality: 80,
        progressive: true,
      })
      .withMetadata();

    if (metadata.format === 'png') {
      processor = processor.flatten({ background: { r: 255, g: 255, b: 255 } }); //? Best for Image Compression: flattening the image to white background if it's transparent
    }

    const compressed = await processor.toBuffer();
    return compressed;
  }

  // private async processImageWithSameFormat(inputBuffer: Buffer) {
  //   let processor = sharp(inputBuffer)
  //     .resize(1920) //? Best for Image Compression: resizing the resolution with only height parameter for maintaining the aspect ratio
  //     .sharpen() //? Best for Image Compression: sharpening the image
  //     .jpeg({
  //       quality: 80,
  //       progressive: true,
  //       force: false,
  //     })
  //     .png({
  //       quality: 80,
  //       progressive: true,
  //       force: false,
  //     })
  //     .withMetadata();

  //   const compressed = await processor.toBuffer();
  //   return compressed;
  // }
}

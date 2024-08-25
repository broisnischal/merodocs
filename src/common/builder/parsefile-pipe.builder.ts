import { HttpStatus, ParseFilePipeBuilder } from '@nestjs/common';

import { FileValidator } from '@nestjs/common';
import fileType from 'file-type-mime';

export const MAX_FILE_SIZE = 5.4 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 5.4 * 1024 * 1024;
const MAX_DOC_SIZE = 5.4 * 1024 * 1024;
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;

export const mimeTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  document: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  video: ['image/heic', 'video/mp4'],
};

type Options = 'image' | 'document' | 'video';
type Both = Options | 'both';

export class UploadFileTypeValidator extends FileValidator {
  private allowedMimeTypes: string[];

  constructor(validatorOptions: Options) {
    const types = mimeTypes[validatorOptions];
    super({
      fileType: types,
    });
    this.allowedMimeTypes = types;
  }

  public isValid(
    file?: Express.Multer.File | undefined,
  ): boolean | Promise<boolean> {
    if (!file?.buffer) return false;

    if (!this.allowedMimeTypes.includes(file.mimetype)) return false;

    const response = fileType.parse(file?.buffer);

    if (!response?.mime) return false;

    return this.allowedMimeTypes.includes(response?.mime);
  }

  public buildErrorMessage(): string {
    return `Upload not allowed. Allowed file types: ${this.allowedMimeTypes.map((i) => i.split('/')[1].toUpperCase()).join(', ')}`;
  }
}

export class UploadBothFileTypeValidator extends FileValidator {
  private allowedMimeTypes: string[];

  constructor(validatorOptions: Both) {
    if (validatorOptions === 'both') {
      const types = [...mimeTypes['image'], ...mimeTypes['document']];

      types.push(...types);
      super({
        fileType: types,
      });
      this.allowedMimeTypes = types;
    } else {
      const types = mimeTypes[validatorOptions];
      super({
        fileType: types,
      });
      this.allowedMimeTypes = types;
    }
  }

  public isValid(
    file?: Express.Multer.File | undefined,
  ): boolean | Promise<boolean> {
    if (!file?.buffer) return false;

    if (!this.allowedMimeTypes.includes(file.mimetype)) return false;

    const response = fileType.parse(file?.buffer);

    if (!response?.mime) return false;

    return this.allowedMimeTypes.includes(response?.mime);
  }

  public buildErrorMessage(): string {
    return `Upload not allowed. Allowed file types: ${this.allowedMimeTypes.join(',')}`;
  }
}

export const createParseFilePipeBuiler = (type: Options) => {
  return new ParseFilePipeBuilder()
    .addValidator(new UploadFileTypeValidator(type))
    .addMaxSizeValidator({
      maxSize:
        type === 'image'
          ? MAX_FILE_SIZE
          : type === 'video'
            ? MAX_VIDEO_SIZE
            : MAX_DOC_SIZE,
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
};

export const createOptionalParseFilePipeBuiler = (type: Both) => {
  return new ParseFilePipeBuilder()
    .addValidator(new UploadBothFileTypeValidator(type))
    .addMaxSizeValidator({
      maxSize:
        type === 'image'
          ? MAX_FILE_SIZE
          : type === 'video'
            ? MAX_VIDEO_SIZE
            : MAX_DOC_SIZE,
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      fileIsRequired: false,
    });
};

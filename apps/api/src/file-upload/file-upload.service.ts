import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: Set<string>;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB default
    this.allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/vcard',
      'text/x-vcard',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ]);
  }

  async validateFile(file: Express.Multer.File, maxSize?: number): Promise<void> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const sizeLimit = maxSize || this.maxFileSize;
    if (file.size > sizeLimit) {
      throw new BadRequestException(`File size exceeds maximum of ${sizeLimit / 1024 / 1024}MB`);
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  async saveFile(file: Express.Multer.File, subdir: string = '', maxSize?: number): Promise<UploadResult> {
    await this.validateFile(file, maxSize);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${Date.now()}-${hash}${ext}`;

    // Create upload directory if it doesn't exist
    const uploadPath = path.join(this.uploadDir, subdir);
    await fs.mkdir(uploadPath, { recursive: true });

    // Save file
    const filepath = path.join(uploadPath, filename);
    await fs.writeFile(filepath, file.buffer);

    // Return upload result
    const baseUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
    const url = `${baseUrl}/api/file-upload/${subdir ? subdir + '/' : ''}${filename}`;

    return {
      filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
    };
  }

  async deleteFile(filename: string, subdir: string = ''): Promise<void> {
    const filepath = path.join(this.uploadDir, subdir, filename);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // File doesn't exist or already deleted - ignore
    }
  }

  async getFileStream(filename: string, subdir: string = ''): Promise<Buffer> {
    const filepath = path.join(this.uploadDir, subdir, filename);
    try {
      return await fs.readFile(filepath);
    } catch (error) {
      throw new BadRequestException('File not found');
    }
  }
}

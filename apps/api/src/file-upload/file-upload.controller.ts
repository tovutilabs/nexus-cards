import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Get,
  Param,
  Res,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('file-upload')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const result = await this.fileUploadService.saveFile(file, 'profiles');
    return {
      message: 'Profile photo uploaded successfully',
      file: result,
    };
  }

  @Post('card-background')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCardBackground(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const result = await this.fileUploadService.saveFile(file, 'cards');
    return {
      message: 'Card background uploaded successfully',
      file: result,
    };
  }

  @Post('card-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCardLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const result = await this.fileUploadService.saveFile(file, 'logos');
    return {
      message: 'Card logo uploaded successfully',
      file: result,
    };
  }

  @Post('contact-attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadContactAttachment(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const result = await this.fileUploadService.saveFile(file, 'contacts');
    return {
      message: 'Contact attachment uploaded successfully',
      file: result,
    };
  }

  @Get(':subdir/:filename')
  async getFile(
    @Param('subdir') subdir: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const buffer = await this.fileUploadService.getFileStream(filename, subdir);
    res.send(buffer);
  }

  @Delete(':subdir/:filename')
  async deleteFile(
    @Param('subdir') subdir: string,
    @Param('filename') filename: string,
    @CurrentUser() user: User,
  ) {
    await this.fileUploadService.deleteFile(filename, subdir);
    return {
      message: 'File deleted successfully',
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { CreateManualContactDto } from './dto/manual-contact.dto';
import { ExportContactsDto, ExportFormat } from './dto/export-contacts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserContacts(
    @Req() req: any,
    @Query('tags') tags?: string,
    @Query('category') category?: string,
    @Query('favoritesOnly') favoritesOnly?: string,
    @Query('search') search?: string
  ) {
    const filters = {
      tags: tags ? tags.split(',') : undefined,
      category,
      favoritesOnly: favoritesOnly === 'true',
      search,
    };

    return this.contactsService.getUserContacts(req.user.id, filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createManualContact(
    @Req() req: any,
    @Body() createContactDto: CreateManualContactDto
  ) {
    return this.contactsService.createManualContact(req.user.id, createContactDto);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  async importContacts(
    @Req() req: any,
    @Body() importContactsDto: ImportContactsDto
  ) {
    return this.contactsService.importContacts(req.user.id, importContactsDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getContactById(@Param('id') id: string, @Req() req: any) {
    return this.contactsService.getContactById(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateContact(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() req: any
  ) {
    return this.contactsService.updateContact(
      id,
      req.user.id,
      updateContactDto
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteContact(@Param('id') id: string, @Req() req: any) {
    return this.contactsService.deleteContact(id, req.user.id);
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  async exportContacts(
    @Req() req: any,
    @Body() exportDto: ExportContactsDto,
    @Res() res: Response
  ) {
    const data = await this.contactsService.exportContacts(req.user.id, exportDto);

    if (exportDto.format === ExportFormat.VCF) {
      res.setHeader('Content-Type', 'text/vcard');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="contacts.vcf"'
      );
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="contacts.csv"'
      );
    }

    res.send(data);
  }
}

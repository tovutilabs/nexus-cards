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
import { SubmitContactDto } from './dto/submit-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserContacts(@Req() req: any) {
    return this.contactsService.getUserContacts(req.user.id);
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
    @Req() req: any,
  ) {
    return this.contactsService.updateContact(id, req.user.id, updateContactDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteContact(@Param('id') id: string, @Req() req: any) {
    return this.contactsService.deleteContact(id, req.user.id);
  }

  @Get('export/:format')
  @UseGuards(JwtAuthGuard)
  async exportContacts(
    @Param('format') format: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const upperFormat = format.toUpperCase();
    
    if (upperFormat !== 'VCF' && upperFormat !== 'CSV') {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid export format. Use VCF or CSV.' });
    }

    const data = await this.contactsService.exportContacts(req.user.id, upperFormat as 'VCF' | 'CSV');

    if (upperFormat === 'VCF') {
      res.setHeader('Content-Type', 'text/vcard');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    }

    res.send(data);
  }
}

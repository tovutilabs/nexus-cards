import { PartialType } from '@nestjs/mapped-types';
import { CreateCardComponentDto } from './create-card-component.dto';

export class UpdateCardComponentDto extends PartialType(CreateCardComponentDto) {}

import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ComponentReorderItem {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentReorderItem)
  components: ComponentReorderItem[];
}

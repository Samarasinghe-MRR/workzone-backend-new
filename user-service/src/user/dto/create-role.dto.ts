import { IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string; // e.g., "admin", "customer", "service_provider"
}

import { UserRole } from '@bitebolt/types';
import { Body, Controller, Get, Patch } from '@nestjs/common';

import { Public, Roles } from '../../common/decorators';

import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Roles(UserRole.ADMIN)
  @Patch('delivery-fee')
  setDeliveryFee(@Body() body: { value: number }) {
    return this.settingsService.setDeliveryFee(body.value);
  }
}

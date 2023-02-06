import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Put,
} from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import {
  UpdateContactDto,
  UpdateLimitCreateOrderTicketDto,
  UpdatePrivacyPolicyDto,
  UpdateTosDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@Controller('api/v1/admins')
export class SettingsController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly settingService: SettingsService,
  ) {}

  @Put('settings/contact')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateContact(@Body() payload: UpdateContactDto) {
    try {
      const settings = await this.settingService.updateSettingByNames(payload);

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        settings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Contact');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('admins.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Get('settings/contact')
  @ResponseStatusCode()
  async getContact() {
    try {
      const settings = await this.settingService.getSettings();

      const listSettings = [];
      for (const setting of settings) {
        if (setting.name.substring(0, 7) == 'contact')
          listSettings.push(setting);
      }

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        listSettings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Get View Contact');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('admins.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Put('settings/privacy-policy')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updatePrivacyPolicy(@Body() payload: UpdatePrivacyPolicyDto) {
    try {
      const settings = await this.settingService.updateSettingByNames(payload);

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        settings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Privacy Policy');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('admins.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Get('settings/privacy-policy')
  @ResponseStatusCode()
  async getPrivacyPolicy(): Promise<RSuccessMessage> {
    try {
      const settings = await this.settingService.getSettings();

      const listSettings = [];
      for (const setting of settings) {
        if (setting.name.substring(0, 7) == 'privacy')
          listSettings.push(setting);
      }

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        listSettings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Get View Privacy Policy');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('admins.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Put('settings/tos')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateTos(@Body() payload: UpdateTosDto) {
    try {
      const settings = await this.settingService.updateSettingByNames(payload);

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        settings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'PUT Update Term of Service');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('admins.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Get('settings/tos')
  @ResponseStatusCode()
  async getTos() {
    try {
      const settings = await this.settingService.getSettings();

      const listSettings = [];
      for (const setting of settings) {
        if (setting.name.substring(0, 3) == 'tos') listSettings.push(setting);
      }

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        listSettings,
      );
    } catch (e) {
      Logger.error(`ERROR ${e.message}`, '', 'Get View Term of Service');
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('admins.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Put('settings/limit-create-order-ticket')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async updateLimitCreateOrderTicket(
    @Body() payload: UpdateLimitCreateOrderTicketDto,
  ) {
    try {
      const settings = await this.settingService.updateSettingByNames(payload);

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        settings,
      );
    } catch (e) {
      Logger.error(
        `ERROR ${e.message}`,
        '',
        'PUT Update Limit Create Order Ticket',
      );
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [this.messageService.get('admins.general.fail')],
          },
          'Bad Request',
        ),
      );
    }
  }

  @Get('settings/limit-create-order-ticket')
  @ResponseStatusCode()
  async getLimitCreateOrderTicket() {
    try {
      const settings = await this.settingService.getSettings();

      const listSettings = [];
      for (const setting of settings) {
        if (setting.name === 'limit_create_order_ticket')
          listSettings.push(setting);
      }

      return this.responseService.success(
        true,
        this.messageService.get('admins.general.success'),
        listSettings,
      );
    } catch (e) {
      Logger.error(
        `ERROR ${e.message}`,
        '',
        'Get View Limit Create Order Ticket',
      );
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('admins.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}

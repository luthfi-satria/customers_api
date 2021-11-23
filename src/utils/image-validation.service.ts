import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class ImageValidationService {
  constructor(
    private readonly hashService: HashService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  async validateAll(req: any, filter: Array<string>) {
    if (req.fileValidationError) {
      const errors: RMessage = {
        value: req.file.originalname,
        property: req.file.fieldname,
        constraint: [this.messageService.get(req.fileValidationError)],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Bad Request',
        ),
      );
    }
    if (filter.includes('required')) {
      await this.required(req.file);
    }
  }

  async required(file: Express.Multer.File, fieldname?: string) {
    if (!file) {
      const errors: RMessage = {
        value: '',
        property: fieldname ?? 'file',
        constraint: [this.messageService.get('file.error.is_required')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Bad Request',
        ),
      );
    }
  }
}

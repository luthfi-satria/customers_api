import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as moment from 'moment';

@ValidatorConstraint({ name: 'DOB' })
@Injectable()
export class ValidDOBRule implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    try {
      return moment(value, 'DD/MM/YYYY', true).isValid();
    } catch (e) {
      console.error(e);
    }
  }
}

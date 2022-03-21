import { randomBytes } from 'crypto';
import { FirebaseDynamicLinks } from 'firebase-dynamic-links';
import moment from 'moment';
import momenttz from 'moment-timezone';
import { extname } from 'path';

export function CreateRandomNumber(pjg: number): string {
  const random_number = parseInt(randomBytes(4).toString('hex'), 16).toString();
  if (pjg == 4) {
    return random_number.substring(random_number.length - 4);
  }
  return random_number.substring(random_number.length - 6);
}

export const editFileName = (req: any, file: any, callback: any) => {
  // const random_number = parseInt('0.' + randomBytes(8).toString('hex'), 16);
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  // const randomName = Array(4)
  //   .fill(null)
  //   .map(() => Math.round(random_number * 16).toString(16))
  //   .join('');
  const randomName = moment().format('x');
  // callback(null, `${name}-${randomName}${fileExtName}`);
  callback(null, `${randomName}-${name}${fileExtName}`);
};

export const imageFileFilter = (req: any, file: any, callback) => {
  if (
    !file.originalname.match(/\.(jpg|jpeg|png|gif)$/) &&
    !file.mimetype.includes('png') &&
    !file.mimetype.includes('jpg') &&
    !file.mimetype.includes('jpeg') &&
    !file.mimetype.includes('gif')
  ) {
    req.fileValidationError = 'file.image.not_allowed';
    callback(null, false);
  }
  callback(null, true);
};

export const dbOutputTime = function (input: Record<string, any>) {
  if (
    typeof input.approved_at != 'undefined' &&
    input.approved_at != null &&
    input.approved_at != 'undefined' &&
    input.approved_at != ''
  ) {
    input.approved_at = momenttz(input.approved_at)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  input.created_at = momenttz(input.created_at)
    .tz('Asia/Jakarta')
    .format('YYYY-MM-DD HH:mm:ss');
  input.updated_at = momenttz(input.updated_at)
    .tz('Asia/Jakarta')
    .format('YYYY-MM-DD HH:mm:ss');
  return input;
};

export const createUrl = function (filename: any) {
  if (typeof filename == 'undefined' || filename == null || filename == '') {
    return null;
  } else {
    return process.env.BASEURL_API + '/api/v1/customers/image' + filename;
  }
};

export const formatingOutputTime = function formatingOutputTime(time: string) {
  return momenttz(time).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
};

export const formatingAllOutputTime = function formatingAllOutputTime(
  object: any,
) {
  for (const key in object) {
    if (object[key] && key.endsWith('_at')) {
      object[key] = this.formatingOutputTime(object[key]);
    }
    if (object[key] && typeof object[key] === 'object') {
      this.formatingAllOutputTime(object[key]);
    }
  }
};

export const removeAllFieldPassword = function removeAllFieldPassword(
  object: any,
) {
  for (const key in object) {
    if (object[key] && key.endsWith('password')) {
      delete object[key];
    }
    if (object[key] && typeof object[key] === 'object') {
      this.removeAllFieldPassword(object[key]);
    }
  }
};

const STYLE_HEADER =
  "font-weight:700;min-height: 10px;left: 0px;top: 40px;font-family: 'Lato';font-style: normal;font-size: 20px;line-height: 24px;font-feature-settings: 'pnum'on, 'lnum'on;color: #26272A;align-self: stretch;";
const CONTENT =
  "min-height: 10px;left: 0px;top: 40px;font-family: 'Lato';font-style: normal;font-size: 20px;line-height: 24px;font-feature-settings: 'pnum'on, 'lnum'on;color: #26272A;flex: none;order: 1;align-self: stretch;flex-grow: 0;";

export const generateMessageUrlVerification = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: 'https://s.efood.co.id',
      link,
    },
  });

  // const message = `
  // Hai, ${name || 'User'}!
  // <br><br>
  // Untuk verifikasi perubahan Email Anda klik link berikut: <a href="${shortLink}">${shortLink}</a> . <br>
  // JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  // WASPADA PENIPUAN!`;
  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Untuk verifikasi perubahan Email Anda klik link berikut: <a href="${shortLink}">${shortLink}</a> . </p>
  <p style="${CONTENT}"> JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  WASPADA PENIPUAN! </p>`;
  return message;
};

export const generateMessageChangeActiveEmail = (name: string): string => {
  // const message = `
  // Hai, ${name || 'User'}!
  // <br><br>
  // Alamat email Anda berhasil diperbaharui, Anda dapat login pada aplikasi eFOOD menggunakan email ini.`;
  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Alamat email Anda berhasil diperbaharui, Anda dapat login pada aplikasi eFOOD menggunakan email ini.</p>`;
  return message;
};

export const generateMessageResetPassword = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: 'https://s.efood.co.id',
      link,
    },
  });

  // const message = `
  // Hai, ${name || 'User'}!
  // <br><br>
  // Untuk mengubah Kata Sandi Anda, Klik link berikut: <a href="${shortLink}">${shortLink}</a> . <br>
  // JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  // WASPADA PENIPUAN!`;
  const message = `
  <p style="${STYLE_HEADER}">Hai, ${name || 'User'}!</p>
  <p style="${CONTENT}"> Untuk mengubah Kata Sandi Anda, Klik link berikut: <a href="${shortLink}">${shortLink}</a> . </p>
  <p style="${CONTENT}"> JANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD. <br>
  WASPADA PENIPUAN! </p>`;
  return message;
};

export const generateSmsUrlVerification = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: 'https://s.efood.co.id',
      link,
    },
  });
  const message = `Hai, ${
    name || 'User'
  }!\n\nUntuk verifikasi No HP Anda klik link berikut: ${shortLink} .\nJANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD.\nWASPADA PENIPUAN!
  `;
  return message;
};

export const generateSmsChangeActiveNoHp = (name: string): string => {
  const message = `Hai, ${
    name || 'User'
  }!\n\nNo HP Anda berhasil diperbaharui, Anda dapat login pada aplikasi eFOOD menggunakan No HP ini.!`;
  return message;
};

export const generateSmsResetPassword = async (
  name: string,
  link: string,
): Promise<string> => {
  const fbLink = new FirebaseDynamicLinks(process.env.FIREBASE_API_KEY);
  const { shortLink } = await fbLink.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: 'https://s.efood.co.id',
      link,
    },
  });

  const message = `Hai, ${
    name || 'User'
  }!\n\nUntuk mengubah Kata Sandi Anda, Klik link berikut: ${shortLink} .\nJANGAN BAGIKAN LINK TERSEBUT KE SIAPAPUN termasuk eFOOD.\nWASPADA PENIPUAN!`;
  return message;
};

export default {
  select: {
    success: 'Get data customer sukses.',
    fail: {
      code: 'ADDRESS_SELECT_FAIL',
      message: 'Get data customer gagal.',
    },
  },
  general: {
    emailNotFound: {
      code: 'EMAIL_NOT_FOUND',
      message: 'Email Customer tidak tersedia.',
    },
    failToProcess: {
      code: 'FAIL_TO_PROCESS',
      message: 'Gagal memproses request.',
    },
    invalidToken: {
      code: 'TOKEN_INVALID',
      message: 'Kode Token yang Anda masukan tidak valid.',
    },
  },
  create: {
    success: 'Create Otp Success.',
    fail: 'Create Otp Gagal.',
    exist: {
      code: 'PHONE_ALREADY_REGISTERED',
      message: 'Nomor handphone kamu sudah terdaftar. Masuk ke aplikasi?',
    },
    invalid: 'Nomor telepon yang anda masukan tidak valid',
    invalid_referral: 'Kode referral yang anda masukan tidak valid',
  },
  validate: {
    success: 'Validasi Otp Success.',
    fail: 'Validasi Otp Gagal.',
    invalid_otp: 'Kode OTP yang Anda masukan tidak valid',
    validated: 'Kode OTP sudah tervalidasi',
  },
  profile: {
    success: 'Update profile successful.',
    fail: {
      code: 'UPDATE_FAIL',
      message: 'Update data gagal.',
    },
    unauthorize: 'Authorisasi tidak valid.',
    invalid: 'Data yang anda masukan tidak valid.',
    invalid_phone: 'Nomor Telepon sudah terdaftar.',
    existemail: {
      code: 'EXIST_EMAIL',
      message: 'Email sudah diapakai oleh user lain.',
    },
  },
  login: {
    success: 'Login Success.',
    fail: 'Login Gagal.',
    invalid: 'Data yang anda masukan tidak valid',
    invalid_email: 'Email dan atau password tidak benar',
    invalid_phone: 'Nomor telepon tidak benar',
    unregistered_phone: {
      code: 'UNREGISTERED_PHONE',
      message: 'No. handphone belum terdaftar. Daftar sebagai member?',
    },
    unregistered_email: {
      code: 'UNREGISTERED_EMAIL',
      message: 'Email belum terdaftar. Daftar sebagai member?',
    },
    password_null: 'Data anda belum lengkap. Silakan lengkapi profile anda.',
  },
  refresh_token: {
    success: 'Refresh Token Success.',
    fail: 'Refresh Token Gagal.',
    update_failed: 'Reset Password Gagal',
    invalid: 'Data yang anda masukan tidak valid',
    invalid_token: 'Kode Token yang Anda masukan tidak valid.',
  },
  reset_password: {
    success: 'Reset Password Success.',
    fail: 'Reset Password Gagal.',
    update_failed: 'Reset Password Gagal',
    invalid: 'Data yang anda masukan tidak valid',
    invalid_token: 'Kode Token yang Anda masukan tidak valid.',
  },
  error: {
    notFound: 'Otp not found.',
    otpExist: 'Otr exist.',
    not_found: {
      code: 'CUSTOMER_NOT_FOUND',
      message: 'Customer tidak ditemukan.',
    },
  },
  email_verification: {
    invalid_token: 'Token yang anda masukan tidak valid atau tidak ditemukan',
    success: 'Verifikasi email sukses',
  },
};

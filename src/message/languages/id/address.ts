export default {
  select: {
    success: 'Get data alamat sukses.',
    not_found: {
      code: 'ADDRESS_NOT_FOUND',
      message: 'Alamat tidak ditemukan.',
    },
  },
  create: {
    success: 'Tambah alamat sukses.',
    fail: {
      code: 'ADDRESS_CREATE_FAIL',
      message: 'Tambah alamat gagal.',
    },
  },
  update: {
    success: 'Ubah alamat sukses.',
    fail: {
      code: 'ADDRESS_UPDATE_FAIL',
      message: 'Ubah alamat gagal.',
    },
    unauthorize: 'Authorisasi tidak valid.',
  },
  delete: {
    success: 'Hapus alamat sukses.',
    fail: {
      code: 'ADDRESS_DELETE_FAIL',
      message: 'Hapus alamat gagal.',
    },
  },
  error: {
    notFound: {
      code: 'ADDRESS_NOTFOUND',
      message: 'Alamat tidak di temukan.',
    },
  },
};

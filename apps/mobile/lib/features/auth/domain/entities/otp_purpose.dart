enum OtpPurpose {
  registration,
  login,
  passwordReset;

  String toApiString() {
    switch (this) {
      case OtpPurpose.registration:
        return 'registration';
      case OtpPurpose.login:
        return 'login';
      case OtpPurpose.passwordReset:
        return 'password_reset';
    }
  }

  static OtpPurpose fromString(String? val) {
    switch (val?.toLowerCase()) {
      case 'login':
        return OtpPurpose.login;
      case 'password_reset':
      case 'passwordreset':
        return OtpPurpose.passwordReset;
      case 'registration':
      default:
        return OtpPurpose.registration;
    }
  }
}

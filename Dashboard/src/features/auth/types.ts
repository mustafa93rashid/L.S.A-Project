export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  newPassword: string
  confirmPassword: string
}

export interface RequestPasswordChangePayload {
  currentPassword: string
}

export interface VerifyPasswordChangePayload {
  verificationCode: string
  newPassword: string
  confirmPassword: string
}

export interface ActivateAccountPayload {
  token: string
  password: string
  confirmPassword: string
}

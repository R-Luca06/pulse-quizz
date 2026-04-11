export class AppError extends Error {
  readonly code: 'rate_limit' | 'api_error' | 'network_error' | 'db_error' | 'auth_error' | 'not_found' | 'validation_error'
  constructor(code: AppError['code'], message?: string) {
    super(message ?? code)
    this.name = 'AppError'
    this.code = code
  }
}
export type AppErrorCode = AppError['code']

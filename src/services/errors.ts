export class AppError extends Error {
  readonly code:
    | 'rate_limit' | 'api_error' | 'network_error' | 'db_error' | 'auth_error' | 'not_found' | 'validation_error'
    // Shop / purchase
    | 'not_authenticated' | 'item_not_found' | 'not_yet_available' | 'no_longer_available' | 'already_owned' | 'insufficient_balance' | 'unknown'
  constructor(code: AppError['code'], message?: string) {
    super(message ?? code)
    this.name = 'AppError'
    this.code = code
  }
}
export type AppErrorCode = AppError['code']

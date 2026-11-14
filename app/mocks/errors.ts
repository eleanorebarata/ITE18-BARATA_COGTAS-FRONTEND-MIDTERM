export function fail(statusCode: number, code: string, message: string, fields?: Record<string, string>) {
  return { statusCode, data: { code, message, fields } }
}
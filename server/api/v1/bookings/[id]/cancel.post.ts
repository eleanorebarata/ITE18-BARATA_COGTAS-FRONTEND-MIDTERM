export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!body?.reasonCode) {
    throw createError({
      statusCode: 422,
      data: { code: 'REASON_REQUIRED', message: 'Choose a reason.', fields: { reasonCode: 'Required' } }
    })
  }
  if (id === 'b-late') {
    throw createError({
      statusCode: 409,
      data: { code: 'CANCEL_WINDOW_CLOSED', message: 'Cancellation closed 30 minutes after acceptance.' }
    })
  }
  return { id, status: 'Cancelled' }
})
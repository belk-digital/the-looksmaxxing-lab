/**
 * Browser-only: POSTs the signed hand-off to the Authorize.net bridge with an auto-submitting form, so the
 * amount and customer details are never placed in a URL (server logs, browser history).
 */
export function submitBridgeHandoff(handoff: { redirectUrl: string; fields: Record<string, string> }): void {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = handoff.redirectUrl
  Object.entries(handoff.fields).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value ?? '')
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

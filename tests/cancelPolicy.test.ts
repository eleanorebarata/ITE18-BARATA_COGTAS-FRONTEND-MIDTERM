import { describe, expect, it } from 'vitest'
import { cancelState, formatCountdown, CANCEL_WINDOW_MINUTES, MAX_STRIKES } from '~/utils/cancelPolicy'

describe('cancellation policy', () => {
  it('uses the agreed numbers', () => {
    expect(CANCEL_WINDOW_MINUTES).toBe(30)
    expect(MAX_STRIKES).toBe(3)
  })

  it('a pending booking can always be cancelled', () => {
    expect(cancelState('Pending', null)).toBe('open')
  })

  it('an accepted booking is cancellable only inside the window', () => {
    expect(cancelState('Accepted', 5 * 60_000)).toBe('window')
    expect(cancelState('Accepted', 0)).toBe('locked')
    expect(cancelState('Accepted', -1000)).toBe('locked')
    expect(cancelState('Accepted', null)).toBe('locked')
  })

  it('finished bookings cannot be cancelled', () => {
    expect(cancelState('Completed', null)).toBe('none')
    expect(cancelState('Declined', null)).toBe('none')
    expect(cancelState('Cancelled', null)).toBe('none')
  })

  it('formats the countdown as m:ss', () => {
    expect(formatCountdown(125_000)).toBe('2:05')
    expect(formatCountdown(-5)).toBe('0:00')
  })
})
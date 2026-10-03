// Display status derived from the stored status and the registration window.
//   completed → admin marked the event completed (certificates issued)
//   open      → registration window is active right now
//   upcoming  → window has not started yet
//   closed    → window is over, event not yet marked completed
export function eventPhase(event, now = Date.now()) {
  if (event.status === 'completed') return 'completed'
  const start = new Date(event.regWindow.start).getTime()
  const end = new Date(event.regWindow.end).getTime()
  if (now < start) return 'upcoming'
  if (now > end) return 'closed'
  return 'open'
}

export const PHASE_LABEL = {
  open: 'Registration open',
  upcoming: 'Upcoming',
  closed: 'Registration closed',
  completed: 'Completed',
}

export const CATEGORY_LABEL = { intra: 'Intra-College', inter: 'Inter-College' }

export function positionLabel(p) {
  return p === 1 ? '1st' : p === 2 ? '2nd' : p === 3 ? '3rd' : 'Participant'
}

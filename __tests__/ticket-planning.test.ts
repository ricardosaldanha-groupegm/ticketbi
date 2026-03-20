import {
  addBusinessDaysInclusive,
  computePlanningFields,
  splitPlanningTicketsBySchedule,
  subtractBusinessDaysInclusive,
  validatePlanningFields,
} from '@/lib/ticket-planning'

describe('ticket-planning', () => {
  it('calculates end date using business days inclusively', () => {
    expect(addBusinessDaysInclusive('2026-03-20', 1)).toBe('2026-03-20')
    expect(addBusinessDaysInclusive('2026-03-20', 2)).toBe('2026-03-23')
  })

  it('calculates start date using business days inclusively', () => {
    expect(subtractBusinessDaysInclusive('2026-03-20', 1)).toBe('2026-03-20')
    expect(subtractBusinessDaysInclusive('2026-03-23', 2)).toBe('2026-03-20')
  })

  it('recalculates start date when the planned end date changes', () => {
    expect(
      computePlanningFields({
        duracao_prevista: 3,
        data_prevista_conclusao: '2026-03-25',
        lastEdited: 'data_prevista_conclusao',
      }),
    ).toEqual({
      duracao_prevista: 3,
      data_inicio_planeada: '2026-03-23',
      data_prevista_conclusao: '2026-03-25',
    })
  })

  it('recalculates end date when the planned start date changes', () => {
    expect(
      computePlanningFields({
        duracao_prevista: 3,
        data_inicio_planeada: '2026-03-20',
        lastEdited: 'data_inicio_planeada',
      }),
    ).toEqual({
      duracao_prevista: 3,
      data_inicio_planeada: '2026-03-20',
      data_prevista_conclusao: '2026-03-24',
    })
  })

  it('validates that planned start is not after planned end', () => {
    expect(
      validatePlanningFields({
        duracao_prevista: 2,
        data_inicio_planeada: '2026-03-25',
        data_prevista_conclusao: '2026-03-24',
      }),
    ).toContain('não pode ser posterior')
  })

  it('splits scheduled and unscheduled tickets for the calendar', () => {
    const result = splitPlanningTicketsBySchedule(
      [
        {
          id: '1',
          assunto: 'Planeado',
          estado: 'novo',
          prioridade: 4,
          urgencia: 2,
          importancia: 2,
          pedido_por: 'A',
          data_inicio_planeada: '2026-03-16',
          data_prevista_conclusao: '2026-03-20',
        },
        {
          id: '2',
          assunto: 'Sem planeamento',
          estado: 'novo',
          prioridade: 3,
          urgencia: 1,
          importancia: 3,
          pedido_por: 'B',
          data_inicio_planeada: null,
          data_prevista_conclusao: '2026-03-20',
        },
        {
          id: '3',
          assunto: 'Fora do periodo',
          estado: 'em_curso',
          prioridade: 6,
          urgencia: 3,
          importancia: 2,
          pedido_por: 'C',
          data_inicio_planeada: '2026-04-01',
          data_prevista_conclusao: '2026-04-03',
        },
      ],
      '2026-03-01',
      '2026-03-31',
    )

    expect(result.scheduled.map((ticket) => ticket.id)).toEqual(['1'])
    expect(result.unscheduled.map((ticket) => ticket.id)).toEqual(['2'])
    expect(result.outOfRange.map((ticket) => ticket.id)).toEqual(['3'])
  })
})

import {
  canReadTicket,
  canEditTicket,
  canCreateSubticket,
  canEditSubticket,
  canDeleteTicket,
  canDeleteSubticket,
  canCommentOnTicket,
  canCommentOnSubticket,
  canUploadToTicket,
  canUploadToSubticket,
  canChangeTicketStatus,
  canChangeSubticketStatus,
  canAssignTicketManager,
  canAssignSubticketAssignee,
  canViewInternalNotes,
  canEditInternalNotes,
  AuthUser,
} from '@/lib/rbac'

// Mock data
const mockRequester: AuthUser = {
  id: 'requester-1',
  name: 'João Silva',
  email: 'joao@empresa.com',
  role: 'requester',
}

const mockBIUser: AuthUser = {
  id: 'bi-1',
  name: 'Maria Santos',
  email: 'maria@empresa.com',
  role: 'bi',
}

const mockAdmin: AuthUser = {
  id: 'admin-1',
  name: 'Pedro Costa',
  email: 'pedro@empresa.com',
  role: 'admin',
}

const mockTicket = {
  id: 'ticket-1',
  created_by: 'requester-1',
  gestor_id: 'bi-1',
  estado: 'novo' as const,
  assunto: 'Test Ticket',
  descricao: 'Test Description',
  urgencia: 1,
  importancia: 1,
  prioridade: 1,
  pedido_por: 'Test User',
  data_pedido: '2024-01-01',
  data_esperada: null,
  sla_date: null,
  internal_notes: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockSubticket = {
  id: 'subticket-1',
  ticket_id: 'ticket-1',
  assignee_bi_id: 'bi-1',
  titulo: 'Test Subticket',
  descricao: 'Test Description',
  estado: 'novo' as const,
  urgencia: 1,
  importancia: 1,
  prioridade: 1,
  data_esperada: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('RBAC Functions', () => {
  describe('canReadTicket', () => {
    it('should allow admin to read any ticket', () => {
      expect(canReadTicket(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to read any ticket', () => {
      expect(canReadTicket(mockBIUser, mockTicket)).toBe(true)
    })

    it('should allow requester to read their own tickets', () => {
      expect(canReadTicket(mockRequester, mockTicket)).toBe(true)
    })

    it('should not allow requester to read other tickets', () => {
      const otherTicket = { ...mockTicket, created_by: 'other-requester' }
      expect(canReadTicket(mockRequester, otherTicket)).toBe(false)
    })
  })

  describe('canEditTicket', () => {
    it('should allow admin to edit any ticket', () => {
      expect(canEditTicket(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to edit tickets they manage', () => {
      expect(canEditTicket(mockBIUser, mockTicket)).toBe(true)
    })

    it('should allow requester to edit their own tickets in early stages', () => {
      expect(canEditTicket(mockRequester, mockTicket)).toBe(true)
    })

    it('should not allow requester to edit tickets in later stages', () => {
      const advancedTicket = { ...mockTicket, estado: 'em_curso' as const }
      expect(canEditTicket(mockRequester, advancedTicket)).toBe(false)
    })

    it('should not allow requester to edit restricted fields', () => {
      expect(canEditTicket(mockRequester, mockTicket, ['gestor_id'])).toBe(false)
    })

    it('should allow requester to edit allowed fields', () => {
      expect(canEditTicket(mockRequester, mockTicket, ['assunto', 'descricao'])).toBe(true)
    })
  })

  describe('canCreateSubticket', () => {
    it('should allow admin to create subtickets', () => {
      expect(canCreateSubticket(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to create subtickets for tickets they manage', () => {
      expect(canCreateSubticket(mockBIUser, mockTicket)).toBe(true)
    })

    it('should not allow requester to create subtickets', () => {
      expect(canCreateSubticket(mockRequester, mockTicket)).toBe(false)
    })

    it('should not allow BI user to create subtickets for tickets they do not manage', () => {
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canCreateSubticket(mockBIUser, otherTicket)).toBe(false)
    })
  })

  describe('canEditSubticket', () => {
    it('should allow admin to edit any subticket', () => {
      expect(canEditSubticket(mockAdmin, mockSubticket)).toBe(true)
    })

    it('should allow BI user to edit subtickets assigned to them', () => {
      expect(canEditSubticket(mockBIUser, mockSubticket)).toBe(true)
    })

    it('should not allow BI user to edit subtickets not assigned to them', () => {
      const otherSubticket = { ...mockSubticket, assignee_bi_id: 'other-bi' }
      expect(canEditSubticket(mockBIUser, otherSubticket)).toBe(false)
    })

    it('should not allow requester to edit subtickets', () => {
      expect(canEditSubticket(mockRequester, mockSubticket)).toBe(false)
    })
  })

  describe('canDeleteTicket', () => {
    it('should allow admin to delete any ticket', () => {
      expect(canDeleteTicket(mockAdmin, mockTicket)).toBe(true)
    })

    it('should not allow BI user to delete tickets', () => {
      expect(canDeleteTicket(mockBIUser, mockTicket)).toBe(false)
    })

    it('should not allow requester to delete tickets', () => {
      expect(canDeleteTicket(mockRequester, mockTicket)).toBe(false)
    })
  })

  describe('canDeleteSubticket', () => {
    it('should allow admin to delete any subticket', () => {
      expect(canDeleteSubticket(mockAdmin, mockSubticket, mockTicket)).toBe(true)
    })

    it('should allow BI user to delete subtickets from tickets they manage', () => {
      expect(canDeleteSubticket(mockBIUser, mockSubticket, mockTicket)).toBe(true)
    })

    it('should not allow BI user to delete subtickets from tickets they do not manage', () => {
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canDeleteSubticket(mockBIUser, mockSubticket, otherTicket)).toBe(false)
    })

    it('should not allow requester to delete subtickets', () => {
      expect(canDeleteSubticket(mockRequester, mockSubticket, mockTicket)).toBe(false)
    })
  })

  describe('canCommentOnTicket', () => {
    it('should allow admin to comment on any ticket', () => {
      expect(canCommentOnTicket(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to comment on tickets they manage', () => {
      expect(canCommentOnTicket(mockBIUser, mockTicket)).toBe(true)
    })

    it('should allow requester to comment on their own tickets', () => {
      expect(canCommentOnTicket(mockRequester, mockTicket)).toBe(true)
    })

    it('should not allow requester to comment on other tickets', () => {
      const otherTicket = { ...mockTicket, created_by: 'other-requester' }
      expect(canCommentOnTicket(mockRequester, otherTicket)).toBe(false)
    })
  })

  describe('canCommentOnSubticket', () => {
    it('should allow admin to comment on any subticket', () => {
      expect(canCommentOnSubticket(mockAdmin, mockSubticket)).toBe(true)
    })

    it('should allow BI user to comment on subtickets assigned to them', () => {
      expect(canCommentOnSubticket(mockBIUser, mockSubticket)).toBe(true)
    })

    it('should not allow BI user to comment on subtickets not assigned to them', () => {
      const otherSubticket = { ...mockSubticket, assignee_bi_id: 'other-bi' }
      expect(canCommentOnSubticket(mockBIUser, otherSubticket)).toBe(false)
    })

    it('should not allow requester to comment on subtickets', () => {
      expect(canCommentOnSubticket(mockRequester, mockSubticket)).toBe(false)
    })
  })

  describe('canUploadToTicket', () => {
    it('should follow same rules as canCommentOnTicket', () => {
      expect(canUploadToTicket(mockAdmin, mockTicket)).toBe(true)
      expect(canUploadToTicket(mockBIUser, mockTicket)).toBe(true)
      expect(canUploadToTicket(mockRequester, mockTicket)).toBe(true)
      
      const otherTicket = { ...mockTicket, created_by: 'other-requester' }
      expect(canUploadToTicket(mockRequester, otherTicket)).toBe(false)
    })
  })

  describe('canUploadToSubticket', () => {
    it('should follow same rules as canCommentOnSubticket', () => {
      expect(canUploadToSubticket(mockAdmin, mockSubticket)).toBe(true)
      expect(canUploadToSubticket(mockBIUser, mockSubticket)).toBe(true)
      expect(canUploadToSubticket(mockRequester, mockSubticket)).toBe(false)
      
      const otherSubticket = { ...mockSubticket, assignee_bi_id: 'other-bi' }
      expect(canUploadToSubticket(mockBIUser, otherSubticket)).toBe(false)
    })
  })

  describe('canChangeTicketStatus', () => {
    it('should allow admin to change any ticket status', () => {
      expect(canChangeTicketStatus(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to change status of tickets they manage', () => {
      expect(canChangeTicketStatus(mockBIUser, mockTicket)).toBe(true)
    })

    it('should not allow BI user to change status of tickets they do not manage', () => {
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canChangeTicketStatus(mockBIUser, otherTicket)).toBe(false)
    })

    it('should not allow requester to change ticket status', () => {
      expect(canChangeTicketStatus(mockRequester, mockTicket)).toBe(false)
    })
  })

  describe('canChangeSubticketStatus', () => {
    it('should allow admin to change any subticket status', () => {
      expect(canChangeSubticketStatus(mockAdmin, mockSubticket)).toBe(true)
    })

    it('should allow BI user to change status of subtickets assigned to them', () => {
      expect(canChangeSubticketStatus(mockBIUser, mockSubticket)).toBe(true)
    })

    it('should not allow BI user to change status of subtickets not assigned to them', () => {
      const otherSubticket = { ...mockSubticket, assignee_bi_id: 'other-bi' }
      expect(canChangeSubticketStatus(mockBIUser, otherSubticket)).toBe(false)
    })

    it('should not allow requester to change subticket status', () => {
      expect(canChangeSubticketStatus(mockRequester, mockSubticket)).toBe(false)
    })
  })

  describe('canAssignTicketManager', () => {
    it('should allow admin to assign ticket managers', () => {
      expect(canAssignTicketManager(mockAdmin)).toBe(true)
    })

    it('should not allow BI user to assign ticket managers', () => {
      expect(canAssignTicketManager(mockBIUser)).toBe(false)
    })

    it('should not allow requester to assign ticket managers', () => {
      expect(canAssignTicketManager(mockRequester)).toBe(false)
    })
  })

  describe('canAssignSubticketAssignee', () => {
    it('should allow admin to assign subticket assignees', () => {
      expect(canAssignSubticketAssignee(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to assign subticket assignees for tickets they manage', () => {
      expect(canAssignSubticketAssignee(mockBIUser, mockTicket)).toBe(true)
    })

    it('should not allow BI user to assign subticket assignees for tickets they do not manage', () => {
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canAssignSubticketAssignee(mockBIUser, otherTicket)).toBe(false)
    })

    it('should not allow requester to assign subticket assignees', () => {
      expect(canAssignSubticketAssignee(mockRequester, mockTicket)).toBe(false)
    })
  })

  describe('canViewInternalNotes', () => {
    it('should allow admin to view internal notes', () => {
      expect(canViewInternalNotes(mockAdmin, mockTicket)).toBe(true)
    })

    it('should allow BI user to view internal notes of tickets they manage', () => {
      expect(canViewInternalNotes(mockBIUser, mockTicket)).toBe(true)
    })

    it('should not allow BI user to view internal notes of tickets they do not manage', () => {
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canViewInternalNotes(mockBIUser, otherTicket)).toBe(false)
    })

    it('should not allow requester to view internal notes', () => {
      expect(canViewInternalNotes(mockRequester, mockTicket)).toBe(false)
    })
  })

  describe('canEditInternalNotes', () => {
    it('should follow same rules as canViewInternalNotes', () => {
      expect(canEditInternalNotes(mockAdmin, mockTicket)).toBe(true)
      expect(canEditInternalNotes(mockBIUser, mockTicket)).toBe(true)
      expect(canEditInternalNotes(mockRequester, mockTicket)).toBe(false)
      
      const otherTicket = { ...mockTicket, gestor_id: 'other-bi' }
      expect(canEditInternalNotes(mockBIUser, otherTicket)).toBe(false)
    })
  })
})

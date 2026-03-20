import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'requester' | 'bi' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'requester' | 'bi' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'requester' | 'bi' | 'admin'
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          created_by: string
          gestor_id: string | null
          recurring_template_id: string | null
          recurring_instance_date: string | null
          estado: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          pedido_por: string
          data_pedido: string
          assunto: string
          descricao: string | null
          objetivo: string
          urgencia: number
          importancia: number
          prioridade: number
          data_esperada: string | null
          data_primeiro_contacto: string | null
          data_prevista_conclusao: string | null
          data_inicio_planeada: string | null
          duracao_prevista: number | null
          data_conclusao: string | null
          data_inicio: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          gestor_id?: string | null
          recurring_template_id?: string | null
          recurring_instance_date?: string | null
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          pedido_por: string
          data_pedido?: string
          assunto: string
          descricao?: string | null
          objetivo: string
          urgencia?: number
          importancia?: number
          data_esperada?: string | null
          data_primeiro_contacto?: string | null
          data_prevista_conclusao?: string | null
          data_inicio_planeada?: string | null
          duracao_prevista?: number | null
          data_conclusao?: string | null
          data_inicio?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          gestor_id?: string | null
          recurring_template_id?: string | null
          recurring_instance_date?: string | null
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          pedido_por?: string
          data_pedido?: string
          assunto?: string
          descricao?: string | null
          objetivo?: string
          urgencia?: number
          importancia?: number
          data_esperada?: string | null
          data_primeiro_contacto?: string | null
          data_prevista_conclusao?: string | null
          data_inicio_planeada?: string | null
          duracao_prevista?: number | null
          data_conclusao?: string | null
          data_inicio?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtickets: {
        Row: {
          id: string
          ticket_id: string
          assignee_bi_id: string
          titulo: string
          descricao: string | null
          estado: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          urgencia: number
          importancia: number
          prioridade: number
          data_esperada: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          assignee_bi_id: string
          titulo: string
          descricao?: string | null
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          urgencia?: number
          importancia?: number
          data_esperada?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          assignee_bi_id?: string
          titulo?: string
          descricao?: string | null
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          urgencia?: number
          importancia?: number
          data_esperada?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_recurring_templates: {
        Row: {
          id: string
          created_by: string
          gestor_id: string | null
          active: boolean
          pedido_por: string
          assunto: string
          descricao: string | null
          objetivo: string | null
          urgencia: number
          importancia: number
          entrega_tipo: 'BI' | 'PHC' | 'Salesforce' | 'Automação' | 'Suporte' | 'Dados/Análises' | 'Interno'
          natureza: 'Novo' | 'Correção' | 'Retrabalho' | 'Esclarecimento' | 'Ajuste' | 'Suporte' | 'Reunião/Discussão' | 'Interno'
          data_esperada: string | null
          data_prevista_conclusao: string | null
          frequency: 'daily' | 'weekly' | 'monthly'
          start_date: string
          next_run_date: string
          end_date: string | null
          last_run_at: string | null
          last_created_ticket_id: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          gestor_id?: string | null
          active?: boolean
          pedido_por: string
          assunto: string
          descricao?: string | null
          objetivo?: string | null
          urgencia?: number
          importancia?: number
          entrega_tipo: 'BI' | 'PHC' | 'Salesforce' | 'Automação' | 'Suporte' | 'Dados/Análises' | 'Interno'
          natureza?: 'Novo' | 'Correção' | 'Retrabalho' | 'Esclarecimento' | 'Ajuste' | 'Suporte' | 'Reunião/Discussão' | 'Interno'
          data_esperada?: string | null
          data_prevista_conclusao?: string | null
          frequency: 'daily' | 'weekly' | 'monthly'
          start_date: string
          next_run_date: string
          end_date?: string | null
          last_run_at?: string | null
          last_created_ticket_id?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          gestor_id?: string | null
          active?: boolean
          pedido_por?: string
          assunto?: string
          descricao?: string | null
          objetivo?: string | null
          urgencia?: number
          importancia?: number
          entrega_tipo?: 'BI' | 'PHC' | 'Salesforce' | 'Automação' | 'Suporte' | 'Dados/Análises' | 'Interno'
          natureza?: 'Novo' | 'Correção' | 'Retrabalho' | 'Esclarecimento' | 'Ajuste' | 'Suporte' | 'Reunião/Discussão' | 'Interno'
          data_esperada?: string | null
          data_prevista_conclusao?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly'
          start_date?: string
          next_run_date?: string
          end_date?: string | null
          last_run_at?: string | null
          last_created_ticket_id?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_recurring_template_subtasks: {
        Row: {
          id: string
          template_id: string
          assignee_bi_id: string
          titulo: string
          descricao: string | null
          urgencia: number
          importancia: number
          estado: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          data_inicio: string | null
          data_inicio_planeado: string | null
          data_esperada: string | null
          data_conclusao: string | null
          retrabalhos: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          assignee_bi_id: string
          titulo: string
          descricao?: string | null
          urgencia?: number
          importancia?: number
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          data_inicio?: string | null
          data_inicio_planeado?: string | null
          data_esperada?: string | null
          data_conclusao?: string | null
          retrabalhos?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          assignee_bi_id?: string
          titulo?: string
          descricao?: string | null
          urgencia?: number
          importancia?: number
          estado?: 'novo' | 'em_analise' | 'em_curso' | 'em_validacao' | 'concluido' | 'rejeitado' | 'bloqueado'
          data_inicio?: string | null
          data_inicio_planeado?: string | null
          data_esperada?: string | null
          data_conclusao?: string | null
          retrabalhos?: number
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          ticket_id: string | null
          subticket_id: string | null
          uploaded_by: string
          filename: string
          mimetype: string
          size_bytes: number
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          subticket_id?: string | null
          uploaded_by: string
          filename: string
          mimetype: string
          size_bytes: number
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string | null
          subticket_id?: string | null
          uploaded_by?: string
          filename?: string
          mimetype?: string
          size_bytes?: number
          url?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          ticket_id: string | null
          subticket_id: string | null
          author_id: string
          author_name: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          subticket_id?: string | null
          author_id: string
          author_name?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string | null
          subticket_id?: string | null
          author_id?: string
          author_name?: string | null
          body?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          entity: string
          entity_id: string
          action: string
          actor_id: string
          payload_json: any
          created_at: string
        }
        Insert: {
          id?: string
          entity: string
          entity_id: string
          action: string
          actor_id: string
          payload_json?: any
          created_at?: string
        }
        Update: {
          id?: string
          entity?: string
          entity_id?: string
          action?: string
          actor_id?: string
          payload_json?: any
          created_at?: string
        }
      }
    }
  }
}

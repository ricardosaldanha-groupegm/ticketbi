import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createAuthUser, canDuplicateTicket } from "@/lib/rbac"
import { createTicket, createTicketSchema, isSupabaseConfigured } from "@/lib/tickets-service"

// POST /api/tickets/[id]/duplicate - Create a new ticket as a copy of an existing one
// Copies main ticket fields and subtickets, but does NOT copy comments or attachments.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Ticket duplication is only supported when Supabase is configured" },
        { status: 501 },
      )
    }

    const supabase = createServerSupabaseClient()

    // Resolve user from header (aligned with DELETE /api/tickets/[id])
    const headerUserId = request.headers.get("x-user-id") || request.headers.get("X-User-Id")
    if (!headerUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", headerUserId)
      .maybeSingle()

    if (userError || !dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = createAuthUser(dbUser as any)

    // Load source ticket
    const { data: sourceTicket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .maybeSingle()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    if (!sourceTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check permission – apenas perfis internos (admin ou gestor BI) podem duplicar tickets
    if (!canDuplicateTicket(user, sourceTicket as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build payload for new ticket using existing ticket data
    const rawPayload = {
      pedido_por: (sourceTicket as any).pedido_por ?? "",
      assunto: ((sourceTicket as any).assunto ?? "") + " (cópia)",
      descricao: (sourceTicket as any).descricao ?? "",
      objetivo: (sourceTicket as any).objetivo ?? "",
      urgencia: (sourceTicket as any).urgencia ?? 1,
      importancia: (sourceTicket as any).importancia ?? 1,
      data_esperada: (sourceTicket as any).data_esperada ?? undefined,
      entrega_tipo: (sourceTicket as any).entrega_tipo ?? "Interno",
      natureza: (sourceTicket as any).natureza ?? "Novo",
    }

    const validated = createTicketSchema.parse(rawPayload)

    const { ticket: newTicket } = await createTicket(validated)

    // Copy subtickets (tarefas) from source ticket to new ticket
    const { data: sourceSubtickets, error: subticketsError } = await supabase
      .from("subtickets")
      .select("*")
      .eq("ticket_id", params.id)

    if (subticketsError) {
      console.error("Error fetching subtickets for duplication:", subticketsError)
    } else if (sourceSubtickets && sourceSubtickets.length > 0) {
      const subticketsToInsert = sourceSubtickets.map((st: any) => ({
        ticket_id: (newTicket as any).id,
        titulo: st.titulo,
        descricao: st.descricao,
        assignee_bi_id: st.assignee_bi_id,
        urgencia: st.urgencia,
        importancia: st.importancia,
        data_inicio: st.data_inicio,
        data_inicio_planeado: st.data_inicio_planeado,
        data_esperada: st.data_esperada,
        data_conclusao: st.data_conclusao,
        estado: st.estado,
        retrabalhos: typeof st.retrabalhos === "number" ? st.retrabalhos : 0,
      }))

      const { error: insertSubticketsError } = await supabase
        .from("subtickets")
        .insert(subticketsToInsert as any)

      if (insertSubticketsError) {
        console.error("Error inserting duplicated subtickets:", insertSubticketsError)
      }
    }

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error: any) {
    console.error("Error duplicating ticket:", error)
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data when duplicating ticket", details: error.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}



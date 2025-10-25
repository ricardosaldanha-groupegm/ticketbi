"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from '@/lib/supabase'
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Tabs, TabsContent, TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
              {isEditing && <TabsTrigger value="edit">Editar</TabsTrigger>}
            </TabsList>
            <div ref={tasksAnchorRef} id="tasks" />

            {isEditing && (
              <TabsContent value="edit" className="space-y-4">
                {(currentRole === 'admin' || currentRole === 'bi') && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Atribuir gestor</CardTitle>
                      <CardDescription>
                        Selecione um utilizador BI (ou admin) para gerir este ticket.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div className="space-y-2">
                          <Label htmlFor="gestor" className="text-slate-300">Gestor</Label>
                          <select
                            id="gestor"
                            className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                            value={selectedGestorId}
                            onChange={(e) => setSelectedGestorId(e.target.value)}
                          >
                            <option value="">Sem gestor</option>
                            {biUsers.map((u) => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" onClick={updateGestor} disabled={isUpdatingGestor} className="bg-amber-600 hover:bg-amber-700">
                            {isUpdatingGestor ? 'A guardar...' : 'Guardar gestor'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(currentRole === 'admin' || currentRole === 'bi') && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Utilizadores interessados</CardTitle>
                      <CardDescription>
                        Selecionar utilizadores (qualquer perfil) que podem consultar este ticket.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Interessados</Label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenInterestedEdit(v => !v)}
                            className="w-full flex items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-left text-slate-100 hover:bg-slate-700/80"
                            aria-haspopup="listbox"
                            aria-expanded={openInterestedEdit}
                          >
                            <span className="truncate">
                              {interestedIds.length === 0 ? 'Selecionar utilizadores...' : `Selecionados (${interestedIds.length})`}
                            </span>
                            <svg className={`h-4 w-4 transition-transform ${openInterestedEdit ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {openInterestedEdit && (
                            <div className="absolute z-50 mt-2 w-full rounded-md border border-slate-600 bg-slate-800 shadow-lg">
                              <div className="p-2 border-b border-slate-700">
                                <input
                                  type="text"
                                  value={interestedQuery}
                                  onChange={(e) => setInterestedQuery(e.target.value)}
                                  placeholder="Procurar por nome ou email..."
                                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none"
                                />
                              </div>
                              <div className="max-h-56 overflow-auto">
                                <ul className="p-2 space-y-1" role="listbox" aria-multiselectable="true">
                                  {allUsers
                                    .filter(u => {
                                      const q = interestedQuery.trim().toLowerCase()
                                      if (!q) return true
                                      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                                    })
                                    .map((u) => (
                                    <li key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700/60 rounded">
                                      <input
                                        type="checkbox"
                                        className="accent-amber-600"
                                        checked={interestedIds.includes(u.id)}
                                        onChange={(e) => {
                                          setInterestedIds(prev => e.target.checked ? Array.from(new Set([...prev, u.id])) : prev.filter(x => x !== u.id))
                                        }}
                                      />
                                      <span className="text-slate-100 truncate">{u.name}</span>
                                      <span className="text-slate-400 text-xs truncate">({u.email})</span>
                                    </li>
                                  ))}
                                  {allUsers.filter(u => {
                                    const q = interestedQuery.trim().toLowerCase()
                                    if (!q) return true
                                    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                                  }).length === 0 && (
                                    <li className="px-3 py-2 text-sm text-slate-400">Sem resultados</li>
                                  )}
                                </ul>
                              </div>
                              <div className="p-2 border-t border-slate-700 flex items-center justify-between">
                                <span className="text-xs text-slate-400">{interestedIds.length} selecionado(s)</span>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" className="h-8 px-2" onClick={() => setOpenInterestedEdit(false)}>Fechar</Button>
                                  <Button type="button" onClick={async () => { await updateInterested(); setOpenInterestedEdit(false) }} disabled={savingInterested} className="bg-amber-600 hover:bg-amber-700 h-8 px-2">
                                    {savingInterested ? 'A guardar...' : 'Guardar'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle>Editar ticket</CardTitle>
                    <CardDescription>
                      Pode editar descrição, objetivo e notas internas. Os restantes campos são apenas de leitura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-slate-300">Assunto</Label>
                          <div className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200">{ticket.assunto}</div>
                        </div>
                        <div>
                          <Label className="text-slate-300">Estado</Label>
                          <div className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200">{getStatusLabel(ticket.estado)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-slate-300">Descrição *</Label>
                        <Textarea id="descricao" rows={4} className="bg-slate-700 text-slate-100" {...register("descricao")} />
                        {errors.descricao && (<p className="text-sm text-red-400">{errors.descricao.message}</p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objetivo" className="text-slate-300">Objetivo do pedido *</Label>
                        <Textarea id="objetivo" rows={3} className="bg-slate-700 text-slate-100" {...register("objetivo")} />
                        {errors.objetivo && (<p className="text-sm text-red-400">{errors.objetivo.message}</p>)}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="urgencia" className="text-slate-300">Urgência (1-3)</Label>
                          <select id="urgencia" className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" {...register("urgencia", { valueAsNumber: true })}>
                            <option value="1">1 - Baixa</option>
                            <option value="2">2 - Média</option>
                            <option value="3">3 - Elevada</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="importancia" className="text-slate-300">Importância (1-3)</Label>
                          <select id="importancia" className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" {...register("importancia", { valueAsNumber: true })}>
                            <option value="1">1 - Baixa</option>
                            <option value="2">2 - Média</option>
                            <option value="3">3 - Elevada</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal_notes" className="text-slate-300">Notas internas</Label>
                        <Textarea id="internal_notes" rows={3} className="bg-slate-700 text-slate-100" {...register("internal_notes")} />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          variant="outline"
                          size="icon"
                          aria-label="Guardar"
                          className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Cancelar"
                          onClick={handleCancel}
                          className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="tasks">
              <TasksList ticketId={ticketId} onEditTicket={() => { setIsEditing(true); setActiveTab('edit') }} />
            </TabsContent>

            <TabsContent value="comments">
              <CommentsList ticketId={ticketId} />
            </TabsContent>

            <TabsContent value="attachments">
              <AttachmentsList ticketId={ticketId} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Prioridades</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Urgência</span>
                <Badge className={priorityColors[ticket.urgencia] ?? "bg-slate-700 text-slate-100"}>{getLevelLabel(ticket.urgencia)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Importância</span>
                <Badge className={priorityColors[ticket.importancia] ?? "bg-slate-700 text-slate-100"}>{getLevelLabel(ticket.importancia)}</Badge>
              </div>
              <div className="flex items-center justify-between order-[-1]">
                <span className="font-semibold">Prioridade</span>
                <Badge className={priorityColors[ticket.prioridade] ?? "bg-slate-700 text-slate-100"}>{ticket.prioridade}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Pessoas envolvidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <div>
                <p className="text-slate-400">Pedido por</p>
                <p>{ticket.pedido_por}</p>
              </div>
              <div>
                <p className="text-slate-400">Criado por</p>
                <p>{ticket.created_by_user.name}</p>
              </div>
              {ticket.gestor && (
                <div>
                  <p className="text-slate-400">Gestor</p>
                  <p>{ticket.gestor.name}</p>
                </div>
              )}
              {taskPeople.filter((n) => ![ticket.pedido_por, ticket.created_by_user.name, ticket.gestor?.name].includes(n)).length > 0 && (
                <div>
                  <p className="text-slate-400">Envolvidos nas tarefas</p>
                  <ul className="mt-1 space-y-1">
                    {taskPeople
                      .filter((n) => ![ticket.pedido_por, ticket.created_by_user.name, ticket.gestor?.name].includes(n))
                      .map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-slate-400">Interessados</p>
                {interestedIds.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {interestedIds.map((id) => {
                      const u = allUsers.find((x) => x.id === id)
                      return (
                        <li key={id} className="text-slate-200">
                          {u ? (
                              <span>{u.name}</span>
                          ) : (
                            <span className="text-slate-400">Utilizador {id}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-500">Nenhum interessado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <div>
                <p className="text-slate-400">Criado em</p>
                <p>{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-400">Atualizado em</p>
                <p>{formatDate(ticket.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>ID do ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-sm text-slate-300">{ticket.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}







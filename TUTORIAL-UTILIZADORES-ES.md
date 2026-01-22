3# Tutorial para Usuarios - TicketBI

## 📋 Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Crear un Nuevo Ticket](#crear-un-nuevo-ticket)
4. [Completar los Campos del Ticket](#completar-los-campos-del-ticket)
5. [Visualizar y Seguir sus Tickets](#visualizar-y-seguir-sus-tickets)
6. [Añadir Comentarios](#añadir-comentarios)
7. [Adjuntar Archivos](#adjuntar-archivos)
8. [Estados de los Tickets](#estados-de-los-tickets)
9. [Notificaciones y Comunicación](#notificaciones-y-comunicación)
10. [Permisos y Limitaciones](#permisos-y-limitaciones)
11. [Consejos y Buenas Prácticas](#consejos-y-buenas-prácticas)
12. [Funcionalidades Futuras](#funcionalidades-futuras)

---

## Introducción

**TicketBI** es una plataforma que permite a los usuarios solicitar servicios y soporte al Departamento de Sistemas e Inteligencia (DSI). A través de este sistema, puede crear tickets para solicitudes de BI, PHC, Salesforce, Automatización, Soporte, Datos/Análisis y otros servicios internos.

Este tutorial le guiará a través de las funcionalidades principales del sistema, desde la creación de un ticket hasta el seguimiento de su progreso.

---

## Acceso al Sistema

### Primer Acceso - Pedir Acesso

Si aún no tiene una cuenta en el sistema, necesita solicitar acceso primero:

1. Acceda a la dirección de TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. En la página de inicio de sesión, haga clic en la pestaña **"Pedir Acesso"**
3. Complete el formulario de solicitud de acceso:
   - **Nome:** Su nombre completo
   - **Email:** Su email profesional (solo se aceptan emails profesionales)
   - **Mensagem:** (Opcional) Puede agregar un mensaje explicando el motivo de la solicitud
4. Haga clic en **"Enviar Pedido"** o **"Submeter"**

> **Importante:** 
> - Solo se aceptan emails profesionales (ej: @groupegm.com)
> - Su solicitud será analizada por un administrador
> - Recibirá una notificación por email cuando su solicitud sea aprobada o rechazada
> - Después de la aprobación, podrá iniciar sesión en el sistema

### Emails de Autenticación

Cuando su solicitud de acceso sea aprobada, recibirá un email de autenticación del sistema:

- **Remetente:** `Supabase Auth <noreply@mail.app.supabase.io>`
- **Assunto:** `O Pedido de acesso ao TicketBI foi aprovado`

> **⚠️ Atención - Verificar Carpeta de Spam:**
> 
> - Los emails de autenticación pueden ser clasificados como **spam** por su cliente de email
> - **Verifique siempre la carpeta de Spam/Correo no deseado** si no recibe el email en su bandeja de entrada
> - **Recomendación:** Marque el email como **"No es Spam"** o agregue el remitente `noreply@mail.app.supabase.io` a su lista de contactos seguros
> - Esto garantiza que recibirá todos los emails futuros del sistema en su bandeja de entrada

### Cómo Iniciar Sesión

Después de que su solicitud de acceso sea aprobada:

1. Acceda a la dirección de TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Haga clic en la pestaña **"Login"** o **"Entrar"**
3. Introduzca su **email profissional** y **palavra-passe**
4. Haga clic en **"Iniciar Sessão"**

> **Nota:** Si no recibió el email de creación de cuenta, verifique la carpeta de Spam y busque emails con el asunto **"O Pedido de acesso ao TicketBI foi aprovado"** o del remitente `noreply@mail.app.supabase.io`

### Primera Vez en el Sistema

Después del primer inicio de sesión, será redirigido a la página principal donde puede:
- Ver sus tickets existentes
- Crear un nuevo ticket
- Acceder al menú de navegación

---

## Crear un Nuevo Ticket

### Paso 1: Acceder al Formulario

1. En el menú superior, haga clic en **"Novo Ticket"** o **"Criar Ticket"**
2. Será redirigido al formulario de creación de ticket

### Paso 2: Completar los Datos Obligatorios

Todos los campos marcados con **asterisco (*)** son obligatorios y deben completarse antes de enviar el ticket.

### Paso 3: Enviar el Ticket

1. Revise todos los datos completados
2. Haga clic en el botón **"Criar Ticket"** o **"Submeter"**
3. Será redirigido a la página de detalles del ticket creado

---

## Completar los Campos del Ticket

### Campos Obligatorios

#### **Pedido por**
- Este campo se **completa automáticamente** con su nombre cuando crea un ticket
- **No puede ser alterado** por usuarios comunes (solo Admin y BI pueden alterarlo)
- El campo aparece deshabilitado y bloqueado con su nombre

#### **Assunto**
- Título breve y descriptivo de su solicitud
- Ejemplo: "Criação de relatório de vendas mensal"

#### **Descrição**
- Descripción detallada de lo que necesita
- Incluya contexto, requisitos específicos y cualquier información relevante
- Cuanto más detallado, mejor será la atención

#### **Objetivo do Pedido**
- Explique el objetivo final de la solicitud
- Para qué se utilizará el resultado
- Qué problema pretende resolver

**Ejemplos:**
- *"Necesito un informe mensual de ventas por región para presentar en la reunión de gestión y tomar decisiones estratégicas sobre asignación de recursos."*
- *"Quiero analizar la evolución del número de clientes en los últimos 6 meses para identificar tendencias y ajustar la estrategia de marketing."*
- *"Necesito datos sobre el tiempo medio de respuesta a solicitudes de soporte para evaluar la eficiencia del equipo e identificar áreas de mejora."*
- *"Necesito un panel con indicadores de rendimiento para monitorear en tiempo real el desempeño de las ventas y tomar acciones correctivas cuando sea necesario."*

### Campos Opcionales

#### **Urgência**
- **1 - Baixa:** Puede esperar más de un mes
- **2 - Média:** Necesario en las próximas semanas
- **3 - Alta:** Necesario en los próximos días

#### **Importância**
- **1 - Baixa:** No crítico para las operaciones
- **2 - Média:** Importante pero hay otros más importantes
- **3 - Alta:** Crítico para las operaciones

> **Nota:** La prioridad del ticket se calcula automáticamente multiplicando Urgência × Importância (máximo 9).

#### **Data Esperada**
- Fecha límite deseada para la conclusión de la solicitud
- Formato: DD/MM/AAAA
- Déjelo en blanco si no tiene una fecha específica

> **⚠️ Importante sobre Data Esperada:**
> 
> - Este campo es una **indicación** para el DSI sobre cuándo le gustaría recibir el resultado
> - **Use principalmente** para tickets **importantes y urgentes** que tienen plazos críticos
> - **No abuse** de este campo - evite definir fechas para todos los tickets
> - El abuso de fechas puede perjudicar la planificación del trabajo del DSI y la gestión eficiente de recursos
> - Si su solicitud no tiene una fecha crítica, deje este campo en blanco para permitir que el DSI organice el trabajo de la mejor manera

#### **Tipo de Entrega**
- **BI:** Business Intelligence
- **PHC:** Sistema PHC
- **Salesforce:** Plataforma Salesforce
- **Automação:** Procesos automatizados
- **Suporte:** Soporte técnico
- **Dados/Análises:** Análisis de datos
- **Interno:** Otros servicios internos (más usado dentro del DSI)

#### **Natureza**
- **Novo:** Nueva solicitud/proyecto
- **Correção:** Corrección de error
- **Retrabalho:** Rehacer trabajo anterior
- **Esclarecimento:** Solicitud de aclaración
- **Ajuste:** Ajuste de funcionalidad existente
- **Suporte:** Solicitud de soporte y ayuda
- **Reunião/Discussão:** Programación de reunión
- **Interno:** Otros

---

## Visualizar y Seguir sus Tickets

### Página de Lista de Tickets

En la página **"Tickets"**, puede ver:
- Todos los tickets que creó
- Tickets donde está marcado como "Pedido por"
- Tickets donde es un usuario interesado

### Filtros Disponibles

- **Responsável:** Filtrar por gestor del ticket
- **Estado:** Filtrar por estado (Novo, Em Curso, Concluído, etc.)
- **Texto:** Buscar por título/assunto

### Informaciones Visuais

- **Bola Amarela:** Ticket con menos de 5 días para conclusión
- **Bola Vermelha:** Ticket con plazo superado (días negativos)
- **Ordenação:** Tickets ordenados por plazo (más urgentes primero)

### Página de Detalhes do Ticket

Al hacer clic en un ticket, verá:

#### **Aba "Detalhes"**
- Informaciones completas del ticket
- Campos en modo de lectura (no editables para usuarios comunes)
- Estado actual del ticket
- Gestor atribuído
- Utilizadores interessados

#### **Aba "Tarefas"**
- Subtareas creadas por el gestor BI
- Progreso de cada tarefa
- Responsables pelas tarefas

#### **Aba "Comentários"**
- Histórico de todas las conversas
- Comentários del gestor BI y otros interessados
- Possibilidade de adicionar novos comentários

#### **Aba "Anexos"**
- Archivos adjuntos al ticket
- Possibilidade de fazer download
- Adicionar novos anexos

---

## Añadir Comentarios

### Cuándo Añadir Comentarios

- Para proporcionar información adicional
- Para responder preguntas del gestor BI
- Para actualizar el contexto de la solicitud
- Para solicitar aclaraciones

### Cómo Añadir un Comentario

1. Acceda a la página de detalhes do ticket
2. Haga clic en la pestaña **"Comentários"**
3. Escriba su comentário en el cuadro de texto
4. (Opcional) Adjunte un archivo si es necesario
5. Haga clic en **"Enviar Comentário"**

### Buenas Prácticas

- Sea claro y objetivo
- Proporcione contexto cuando sea necesario
- Responda prontamente a preguntas del gestor BI
- Use comentários para mantener la comunicación activa

---

## Adjuntar Archivos

### Cuándo Adjuntar Archivos

- Documentos de referencia
- Ejemplos de datos
- Capturas de pantalla o imágenes
- Archivos de ejemplo del formato deseado
- Cualquier material que ayude a aclarar la solicitud

### Cómo Adjuntar un Archivo

#### **Na Aba "Anexos"**
1. Haga clic en el botón **"Adicionar Anexo"**
2. Seleccione el archivo de su computadora
3. Espere a que se complete la carga
4. El archivo aparecerá en la lista de anexos

#### **Junto com um Comentário**
1. En la pestaña "Comentários", escriba su comentário
2. Haga clic en **"Escolher Ficheiro"** o **"Anexar"**
3. Seleccione el archivo
4. Haga clic en **"Enviar Comentário"**
5. El archivo será adjuntado y aparecerá un enlace en el comentário

### Tipos de Archivos Soportados

- Documentos: PDF, DOC, DOCX, XLS, XLSX
- Imágenes: JPG, PNG, GIF
- Datos: CSV, TXT
- Otros formatos comunes

### Límites

- Tamaño máximo por archivo: Verifique con el administrador
- Se pueden adjuntar múltiples archivos al mismo ticket

---

## Estados de los Tickets

### Estados Posibles

#### **Novo**
- El ticket acaba de ser creado
- Aún no se ha atribuido un gestor
- Esperando análisis inicial

#### **Em Análise**
- El gestor BI está analizando la solicitud
- Se pueden solicitar aclaraciones
- Verifique los comentários regularmente

#### **Em Curso**
- El trabajo está siendo realizado
- Puede haber actualizaciones en las tarefas
- Siga el progreso a través de los comentários

#### **Em Validação**
- Trabajo concluido, esperando validación
- Se puede solicitar retroalimentación
- Verifique si el resultado corresponde al esperado

#### **Aguardando 3ºs**
- Esperando información o acción de terceros
- Puede ser necesario esperar o proporcionar más información

#### **Standby**
- Ticket temporalmente pausado
- Esperando condiciones para continuar
- Se reanudará cuando sea posible

#### **Concluído**
- Trabajo finalizado y validado
- Puede consultar los resultados
- Ticket archivado

#### **Bloqueado**
- Ticket bloqueado por algún motivo
- Verifique los comentários para más información
- Puede ser necesario crear un nuevo ticket

#### **Rejeitado**
- La solicitud no puede ser atendida
- Verifique los comentários para entender el motivo
- Puede crear un nuevo ticket con información diferente

---

## Notificaciones y Comunicación

### Cómo Recibe Notificaciones

Cuando ocurren eventos importantes en su ticket, recibirá notificaciones por email:

- **Novo comentário:** Cuando alguien añade un comentario
  - La notificación incluye un **resumo da conversa** del ticket, permitiéndole entender el contexto sin tener que acceder al sistema
- **Mudança de estado:** Cuando el estado del ticket cambia
- **Data de conclusão:** Cuando se define o altera una data prevista de conclusão

### Destinatarios de las Notificaciones

- **Pedido por:** Usted (usuario que creó el ticket)
- **Interessados:** Usuarios marcados como interessados en el ticket

### Mantenerse Informado

- Verifique regularmente la página de tickets
- Lea los comentários cuando reciba notificaciones
- Responda prontamente a preguntas del gestor BI

> **💡 Consejo:** Si no recibe notificaciones por email, verifique la carpeta de Spam. Los emails del sistema pueden ser clasificados como spam por su cliente de email.

---

## Permisos y Limitaciones

### Lo Que Puede Hacer

✅ **Criar tickets** con solicitudes al DSI  
✅ **Ver os seus tickets** y tickets donde es interessado  
✅ **Adicionar comentários** en sus tickets  
✅ **Anexar ficheiros** a sus tickets  
✅ **Ver detalhes** completos de sus tickets  
✅ **Fazer download** de anexos  

### Lo Que No Puede Hacer

❌ **Editar campos** del ticket después de la creación (excepto algunos campos limitados en estados iniciales)  
❌ **Alterar o estado** del ticket  
❌ **Atribuir gestores**  
❌ **Criar tarefas** (subtickets)  
❌ **Eliminar tickets**  
❌ **Ver tickets** de otros usuarios (excepto donde es interessado)  

### Ediciones Limitadas

En estados iniciales (**Novo** o **Em Análise**), puede editar:
- Assunto
- Descrição
- Data esperada

Después de que el ticket pase a **Em Curso** o estados posteriores, ya no puede editar.

---

## Consejos y Buenas Prácticas

### Al Crear un Ticket

1. **Sea específico:** Describa exactamente lo que necesita
2. **Proporcione contexto:** Explique el contexto y objetivo
3. **Adjunte ejemplos:** Si es posible, adjunte archivos de ejemplo
4. **Defina prioridades:** Sea realista con urgência e importância
5. **Revise antes de enviar:** Verifique que todos los datos estén correctos

### Durante el Seguimiento

1. **Sea proactivo:** Responda rápidamente a preguntas
2. **Mantenga comunicación:** Use comentários para mantener informado al gestor
3. **Proporcione retroalimentación:** Cuando se solicite, dé retroalimentación clara
4. **Sea paciente:** Algunas solicitudes pueden llevar tiempo

### Comunicación Eficaz

- **Sea claro y objetivo** en los comentários
- **Proporcione ejemplos** cuando sea posible
- **Responda a todas las preguntas** del gestor BI
- **Agradezca** cuando el trabajo esté concluido

### Resolución de Problemas

- **¿No puede ver un ticket?** Verifique si fue creado por usted o si es interessado
- **¿No puede comentar?** Verifique si tiene permisos en el ticket
- **¿Error al adjuntar archivo?** Verifique el tamaño y formato del archivo
- **¿Dudas?** Contacte al administrador del sistema

---

## Funcionalidades Futuras

TicketBI está en constante evolución. Las siguientes funcionalidades están en desarrollo y estarán disponibles pronto:

### Creación de Tickets por Email

**En fase de conclusão** - Pronto podrá crear tickets simplemente enviando un email.

**Cómo funcionará:**
- Envíe un email a la dirección dedicada de TicketBI (a comunicar)
- El sistema creará automáticamente un ticket basado en el contenido de su email
- El assunto do email se usará como "Assunto" del ticket
- O corpo do email se usará como "Descrição" del ticket
- Os anexos do email se añadirán automáticamente al ticket

**Ventajas:**
- **Ganho de tempo:** Gran parte de los tickets abiertos en el DSI provienen de conversas y contexto ya escritos por email
- **Facilidade:** No necesita completar manualmente los campos del formulario
- **Contexto preservado:** Todo el histórico da conversa por email queda disponible en el ticket
- **Anexos automáticos:** Los archivos enviados por email se adjuntan automáticamente al ticket

**Cuando esté disponible:**
- Recibirá instrucciones sobre la dirección de email a utilizar
- La dirección será única para cada usuario o departamento
- Podrá continuar usando el formulario web normalmente

---

## Conclusión

TicketBI fue creado para facilitar la comunicación entre usuarios y el Departamento de Sistemas de Información. Al seguir este tutorial y las buenas prácticas sugeridas, podrá utilizar el sistema de forma eficiente y obtener los mejores resultados de sus solicitudes.

### ¿Necesita Ayuda?

Si tiene dudas o problemas:
1. Consulte este tutorial nuevamente
2. Verifique los comentários en el ticket para orientaciones
3. Contacte al administrador del sistema


---

**Última atualização:** Enero 2026

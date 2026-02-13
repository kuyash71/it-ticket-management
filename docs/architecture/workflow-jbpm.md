# Workflow Architecture (jBPM)

## Amaç

Ticket yaşam döngüsü davranışlarını workflow engine üzerinden standardize etmek.

## Mevcut Uygulama

- Process ID: `itsm.ticket.lifecycle`
- Kaynak dosya: `backend/src/main/resources/processes/ticket-lifecycle.bpmn2`
- Session: `itsm-ticket-session` (`kmodule.xml`)

## Tetikleme

`TicketService#create` sonrasında process start edilir.

## Genişleme

İlerleyen sprintlerde status transition, approval ve escalation adımları BPMN içine detaylandırılacaktır.

-- Rename JPA discriminator column from quoted "TicketType" (mixed case) to ticket_type.
-- Hibernate's snake_case naming strategy queries for ticket_type; old V1 created it quoted.
ALTER TABLE tickets RENAME COLUMN "TicketType" TO ticket_type;

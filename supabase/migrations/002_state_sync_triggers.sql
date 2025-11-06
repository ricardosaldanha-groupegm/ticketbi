-- Function to sync ticket status based on subtickets
CREATE OR REPLACE FUNCTION sync_ticket_status_from_subtickets()
RETURNS TRIGGER AS $$
DECLARE
    ticket_record RECORD;
    subticket_count INTEGER;
    completed_count INTEGER;
    blocked_count INTEGER;
    rejected_count INTEGER;
BEGIN
    -- Get the ticket record
    SELECT * INTO ticket_record FROM tickets WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);
    
    -- Count subtickets by status
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'concluido'),
        COUNT(*) FILTER (WHERE estado = 'bloqueado'),
        COUNT(*) FILTER (WHERE estado = 'rejeitado')
    INTO subticket_count, completed_count, blocked_count, rejected_count
    FROM subtickets 
    WHERE ticket_id = ticket_record.id;
    
    -- If no subtickets, don't change ticket status
    IF subticket_count = 0 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- If all subtickets are completed, move ticket to validation
    IF completed_count = subticket_count THEN
        UPDATE tickets 
        SET estado = 'em_validacao', updated_at = NOW()
        WHERE id = ticket_record.id AND estado != 'em_validacao';
    END IF;
    
    -- If any subticket is blocked, block the ticket
    IF blocked_count > 0 THEN
        UPDATE tickets 
        SET estado = 'bloqueado', updated_at = NOW()
        WHERE id = ticket_record.id AND estado != 'bloqueado';
    END IF;
    
    -- If any subticket is in progress, ensure ticket is at least in progress
    IF EXISTS (SELECT 1 FROM subtickets WHERE ticket_id = ticket_record.id AND estado = 'em_curso') THEN
        UPDATE tickets 
        SET estado = 'em_curso', updated_at = NOW()
        WHERE id = ticket_record.id AND estado IN ('novo', 'em_analise');
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to handle ticket status changes affecting subtickets
CREATE OR REPLACE FUNCTION sync_subtickets_from_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If ticket is blocked, block all its subtickets
    IF NEW.estado = 'bloqueado' AND OLD.estado != 'bloqueado' THEN
        UPDATE subtickets 
        SET estado = 'bloqueado', updated_at = NOW()
        WHERE ticket_id = NEW.id AND estado != 'bloqueado';
    END IF;
    
    -- If ticket is rejected, reject all its subtickets
    IF NEW.estado = 'rejeitado' AND OLD.estado != 'rejeitado' THEN
        UPDATE subtickets 
        SET estado = 'rejeitado', updated_at = NOW()
        WHERE ticket_id = NEW.id AND estado NOT IN ('rejeitado', 'concluido');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent closing ticket with open subtickets
CREATE OR REPLACE FUNCTION prevent_close_ticket_with_open_subtickets()
RETURNS TRIGGER AS $$
DECLARE
    open_subtickets_count INTEGER;
BEGIN
    -- Check if trying to close ticket (concluido or rejeitado)
    IF NEW.estado IN ('concluido', 'rejeitado') AND OLD.estado NOT IN ('concluido', 'rejeitado') THEN
        -- Count non-closed subtickets
        SELECT COUNT(*) INTO open_subtickets_count
        FROM subtickets 
        WHERE ticket_id = NEW.id 
        AND estado NOT IN ('concluido', 'rejeitado');
        
        -- If there are open subtickets, prevent the change
        IF open_subtickets_count > 0 THEN
            RAISE EXCEPTION 'Cannot close ticket with open subtickets. Please close all subtickets first.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER sync_ticket_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subtickets
    FOR EACH ROW EXECUTE FUNCTION sync_ticket_status_from_subtickets();

CREATE TRIGGER sync_subtickets_from_ticket_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION sync_subtickets_from_ticket_status();

CREATE TRIGGER prevent_close_ticket_trigger
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION prevent_close_ticket_with_open_subtickets();

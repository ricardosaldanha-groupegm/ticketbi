-- Check if tickets table exists and add missing columns
DO $$
BEGIN
    -- Check if tickets table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        -- Add objetivo column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'objetivo') THEN
            ALTER TABLE tickets ADD COLUMN objetivo TEXT;
            RAISE NOTICE 'Added objetivo column to tickets table';
        ELSE
            RAISE NOTICE 'objetivo column already exists in tickets table';
        END IF;
        
        -- Update existing tickets with default objetivo if needed
        UPDATE tickets 
        SET objetivo = 'Objetivo não especificado' 
        WHERE objetivo IS NULL OR objetivo = '';
        
        -- Make objetivo column NOT NULL
        ALTER TABLE tickets ALTER COLUMN objetivo SET NOT NULL;
        
        -- Add check constraint for objetivo
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'check_objetivo_not_empty') THEN
            ALTER TABLE tickets ADD CONSTRAINT check_objetivo_not_empty 
            CHECK (LENGTH(TRIM(objetivo)) > 0);
        END IF;
        
        RAISE NOTICE 'Successfully updated tickets table';
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE tickets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            pedido_por VARCHAR(255) NOT NULL,
            assunto VARCHAR(255) NOT NULL,
            descricao TEXT NOT NULL,
            objetivo TEXT NOT NULL,
            urgencia INTEGER NOT NULL CHECK (urgencia >= 1 AND urgencia <= 5),
            importancia INTEGER NOT NULL CHECK (importancia >= 1 AND importancia <= 5),
            data_esperada DATE,
            estado VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado')),
            gestor_id UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
        CREATE INDEX IF NOT EXISTS idx_tickets_gestor_id ON tickets(gestor_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
        
        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_tickets_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
        CREATE TRIGGER trigger_update_tickets_updated_at
            BEFORE UPDATE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_tickets_updated_at();
            
        RAISE NOTICE 'Created tickets table with all required columns';
    END IF;
END $$;

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

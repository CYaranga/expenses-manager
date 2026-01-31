-- Add type column to expenses table ('expense' or 'income')
ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';

-- Create index on type for filtering
CREATE INDEX idx_expenses_type ON expenses(type);

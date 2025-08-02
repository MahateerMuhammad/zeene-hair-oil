-- Add sale columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sale_percentage INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN public.products.is_on_sale IS 'Whether the product is currently on sale';
COMMENT ON COLUMN public.products.sale_price IS 'The discounted price when on sale';
COMMENT ON COLUMN public.products.sale_percentage IS 'The discount percentage (1-99)';

-- Add check constraint to ensure sale_percentage is between 1 and 99
ALTER TABLE public.products 
ADD CONSTRAINT check_sale_percentage 
CHECK (sale_percentage IS NULL OR (sale_percentage >= 1 AND sale_percentage <= 99));

-- Add check constraint to ensure sale_price is positive when set
ALTER TABLE public.products 
ADD CONSTRAINT check_sale_price_positive 
CHECK (sale_price IS NULL OR sale_price > 0);

-- Add check constraint to ensure sale_price is less than regular price when both are set
ALTER TABLE public.products 
ADD CONSTRAINT check_sale_price_less_than_regular 
CHECK (sale_price IS NULL OR price IS NULL OR sale_price < price);
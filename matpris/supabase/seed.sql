-- supabase/seed.sql
-- Common Norwegian grocery products for MVP testing
-- Insert ~30 products as seed data

insert into public.products (name, brand, category, weight_volume) values
('Melk', 'Tine', 'melk_og_drikkevarer', '1L'),
('Smør', 'Tine', 'meieri', '250g'),
('Yoghurt', 'Tine', 'meieri', '150g'),
('Ost Geitost', 'Tine', 'meieri', '250g'),
('Brød Grahamsbrød', 'Kneipp', 'bakeri', '400g'),
('Brød Glutenfritt', 'Kneipp', 'bakeri', '300g'),
('Egg', 'Frittgående', 'meieri', '10 stk'),
('Kjøttdeig', 'Gilde', 'kjøtt', '500g'),
('Kyllingfilet', 'Gilde', 'kjøtt', '400g'),
('Biff', 'Gilde', 'kjøtt', '400g'),
('Tomat', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Løk', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Gulrot', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Poteter', 'Naturlig', 'frukt_og_grønt', '2kg'),
('Bananas', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Epler', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Appelsin', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Hvitløk', 'Naturlig', 'frukt_og_grønt', '100g'),
('Pasta', 'Bariella', 'pasta_og_rise', '500g'),
('Ris', 'Kolik', 'pasta_og_rise', '1kg'),
('Kaffe', 'Friele', 'drikke', '250g'),
('Tee', 'Lipton', 'drikke', '20 poser'),
('Juice', 'Molino', 'drikke', '1L'),
('Cola', 'Coca-Cola', 'drikke', '1.5L'),
('Kakao', 'Freia', 'drikke', '250g'),
('Kjeks Safari', 'Opak', 'snacks', '150g'),
('Chips', 'Lay''s', 'snacks', '200g'),
('Sjokolade', 'Freia', 'snacks', '100g'),
('Leverpostei', 'Ikkelønn', 'kjøtt', '200g'),
('Syltetøy', 'Freia', 'bakeri', '400g');

-- Run with: supabase db seed (if using supabase CLI)
-- Or: Copy-paste into Supabase dashboard SQL editor

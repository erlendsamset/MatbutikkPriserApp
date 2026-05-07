-- supabase/seed.sql
-- Common Norwegian grocery products for MVP testing
-- Insert ~30 products as seed data with weight_grams for kg-price calculations

insert into public.products (name, brand, category, weight_volume, weight_grams) values
('Melk', 'Tine', 'melk_og_drikkevarer', '1L', null),
('Smør', 'Tine', 'meieri', '250g', 250),
('Yoghurt', 'Tine', 'meieri', '150g', 150),
('Ost Geitost', 'Tine', 'meieri', '250g', 250),
('Brød Grahamsbrød', 'Kneipp', 'bakeri', '400g', null),
('Brød Glutenfritt', 'Kneipp', 'bakeri', '300g', null),
('Egg', 'Frittgående', 'meieri', '10 stk', null),
('Kjøttdeig', 'Gilde', 'kjøtt', '500g', 500),
('Kyllingfilet', 'Gilde', 'kjøtt', '400g', 400),
('Biff', 'Gilde', 'kjøtt', '400g', 400),
('Tomat', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Løk', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Gulrot', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Poteter', 'Naturlig', 'frukt_og_grønt', '2kg', 2000),
('Bananas', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Epler', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Appelsin', 'Naturlig', 'frukt_og_grønt', '1kg', 1000),
('Hvitløk', 'Naturlig', 'frukt_og_grønt', '100g', 100),
('Pasta', 'Bariella', 'pasta_og_rise', '500g', null),
('Ris', 'Kolik', 'pasta_og_rise', '1kg', null),
('Kaffe', 'Friele', 'drikke', '250g', 250),
('Tee', 'Lipton', 'drikke', '20 poser', null),
('Juice', 'Molino', 'drikke', '1L', null),
('Cola', 'Coca-Cola', 'drikke', '1.5L', null),
('Kakao', 'Freia', 'drikke', '250g', 250),
('Kjeks Safari', 'Opak', 'snacks', '150g', null),
('Chips', 'Lays', 'snacks', '200g', null),
('Sjokolade', 'Freia', 'snacks', '100g', null),
('Leverpostei', 'Ikkelønn', 'kjøtt', '200g', 200),
('Syltetøy', 'Freia', 'bakeri', '400g', null);

-- Run with: supabase db seed (if using supabase CLI)
-- Or: Copy-paste into Supabase dashboard SQL editor

-- ==============================================================================
-- HACKPACT / SAATHI: SEED DATA
-- Pre-seeding Cities, External Hackathons, Structured Skills
-- ==============================================================================

-- 1. CITIES (Starting with Hyderabad as the cold-start launch city)
INSERT INTO public.cities (id, name, state, country, location, is_active, target_members) VALUES
('c0000000-0000-0000-0000-000000000001', 'Hyderabad', 'Telangana', 'India', ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326)::geography, true, 50),
('c0000000-0000-0000-0000-000000000002', 'Bengaluru', 'Karnataka', 'India', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000003', 'Pune', 'Maharashtra', 'India', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000004', 'Delhi NCR', 'Delhi', 'India', ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000005', 'Mumbai', 'Maharashtra', 'India', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, false, 50)
ON CONFLICT (name) DO NOTHING;

-- 2. STRUCTURED SKILLS
INSERT INTO public.skills (id, name, category) VALUES
-- Frontend
('s0000000-0000-0000-0000-000000000001', 'Next.js / React', 'frontend'),
('s0000000-0000-0000-0000-000000000002', 'Tailwind CSS', 'frontend'),
('s0000000-0000-0000-0000-000000000003', 'TypeScript', 'frontend'),
('s0000000-0000-0000-0000-000000000004', 'Vue.js / Nuxt', 'frontend'),
-- Backend
('s0000000-0000-0000-0000-000000000005', 'Node.js / Express', 'backend'),
('s0000000-0000-0000-0000-000000000006', 'Python / FastAPI', 'backend'),
('s0000000-0000-0000-0000-000000000007', 'Go (Golang)', 'backend'),
('s0000000-0000-0000-0000-000000000008', 'PostgreSQL / SQL', 'backend'),
('s0000000-0000-0000-0000-000000000009', 'Rust', 'backend'),
-- ML / AI
('s0000000-0000-0000-0000-000000000010', 'LLMs & AI Agents', 'ml_ai'),
('s0000000-0000-0000-0000-000000000011', 'PyTorch / Deep Learning', 'ml_ai'),
('s0000000-0000-0000-0000-000000000012', 'Computer Vision (OpenCV)', 'ml_ai'),
('s0000000-0000-0000-0000-000000000013', 'NLP & Embeddings', 'ml_ai'),
-- Mobile
('s0000000-0000-0000-0000-000000000014', 'Flutter / Dart', 'mobile'),
('s0000000-0000-0000-0000-000000000015', 'React Native', 'mobile'),
('s0000000-0000-0000-0000-000000000016', 'Kotlin (Android)', 'mobile'),
-- Hardware / IoT
('s0000000-0000-0000-0000-000000000017', 'Arduino & ESP32', 'hardware_iot'),
('s0000000-0000-0000-0000-000000000018', 'Raspberry Pi / Robotics', 'hardware_iot'),
('s0000000-0000-0000-0000-000000000019', 'Embedded C / C++', 'hardware_iot'),
-- Design
('s0000000-0000-0000-0000-000000000020', 'Figma UI/UX', 'design'),
('s0000000-0000-0000-0000-000000000021', 'Product Prototyping', 'design'),
('s0000000-0000-0000-0000-000000000022', '3D / Spline / Motion', 'design'),
-- Product
('s0000000-0000-0000-0000-000000000023', 'Product Management', 'product'),
('s0000000-0000-0000-0000-000000000024', 'User Research & Wireframing', 'product'),
-- DevOps
('s0000000-0000-0000-0000-000000000025', 'Docker & Kubernetes', 'devops'),
('s0000000-0000-0000-0000-000000000026', 'AWS / Cloud Infrastructure', 'devops'),
-- Blockchain
('s0000000-0000-0000-0000-000000000027', 'Solidity & Smart Contracts', 'blockchain'),
('s0000000-0000-0000-0000-000000000028', 'Web3.js / Ethers', 'blockchain'),
-- Pitching & Storytelling
('s0000000-0000-0000-0000-000000000029', 'Pitch Deck & Storytelling', 'pitching'),
('s0000000-0000-0000-0000-000000000030', 'Demo Delivery & Presentation', 'pitching')
ON CONFLICT (name) DO NOTHING;

-- 3. EXTERNAL HACKATHONS
INSERT INTO public.hackathons (
    id, name, slug, organizer, mode, city_id, venue, start_date, end_date,
    registration_deadline, prize_pool, theme, description, website_url,
    min_team_size, max_team_size, is_published
) VALUES
(
    'h0000000-0000-0000-0000-000000000001',
    'Smart India Hackathon 2026',
    'smart-india-hackathon-2026',
    'Ministry of Education & AICTE',
    'offline',
    'c0000000-0000-0000-0000-000000000001',
    'Nodal Centres across Hyderabad & India',
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '27 days',
    NOW() + INTERVAL '12 days',
    '₹1,00,000 / Problem Statement',
    'GovTech, Smart Automation, Healthcare & Agriculture',
    'The premier nationwide innovation challenge to solve real-world problems facing government ministries and public sectors.',
    'https://sih.gov.in',
    6, 6, true
),
(
    'h0000000-0000-0000-0000-000000000002',
    'HackHyderabad 2026',
    'hackhyderabad-2026',
    'T-Hub & Hyderabad Tech Community',
    'offline',
    'c0000000-0000-0000-0000-000000000001',
    'T-Hub Phase 2, Knowledge City, Hyderabad',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '7 days',
    '₹5,00,000',
    'AI Agents, FinTech & Smart Cities',
    'Hyderabad''s flagship 36-hour external builder hackathon bringing together the top 500 collegiate hackers across Telangana and Andhra Pradesh.',
    'https://hackhyderabad.org',
    2, 4, true
),
(
    'h0000000-0000-0000-0000-000000000003',
    'EthIndia 2026',
    'ethindia-2026',
    'Devfolio & Ethereum Foundation',
    'hybrid',
    'c0000000-0000-0000-0000-000000000002',
    'KTPO Bengaluru & Hyderabad Satellite Hub',
    NOW() + INTERVAL '40 days',
    NOW() + INTERVAL '42 days',
    NOW() + INTERVAL '20 days',
    '₹65,00,000+',
    'Web3 Infrastructure, Zero-Knowledge & DeFi',
    'Asia''s largest Ethereum hackathon. Gather with global protocol builders, core devs, and venture funds to build the decentralized web.',
    'https://ethindia.co',
    2, 4, true
),
(
    'h0000000-0000-0000-0000-000000000004',
    'Google Solution Challenge 2026',
    'google-solution-challenge-2026',
    'Google Developer Student Clubs',
    'online',
    NULL,
    'Online (Global)',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '35 days',
    NOW() + INTERVAL '15 days',
    '$100,000 in Mentorship & Prizes',
    '17 UN Sustainable Development Goals',
    'Build a solution for a local community problem using one or more Google technologies: Gemini, Firebase, Android, Google Cloud, or Flutter.',
    'https://developers.google.com/community/gdsc-solution-challenge',
    2, 4, true
),
(
    'h0000000-0000-0000-0000-000000000005',
    'Devpost Global Agentic AI Hackathon',
    'devpost-agentic-ai-2026',
    'Devpost',
    'online',
    NULL,
    'Online (Devpost)',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '17 days',
    NOW() + INTERVAL '5 days',
    '$50,000',
    'Autonomous AI Agents & Tool Calling',
    'Build multi-agent workflows that run autonomously, execute complex tool calls, and solve end-to-end knowledge worker problems.',
    'https://devpost.com',
    1, 4, true
)
ON CONFLICT (slug) DO NOTHING;

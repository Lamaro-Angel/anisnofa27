
-- ====================================================================
-- COMPLETE TEST DATA - SUBJECTS, CLASS_SUBJECTS, GRADES, ATTENDANCE, TUITION
-- ====================================================================

-- 1) Create additional subjects
INSERT INTO public.subjects (id, name, code, description, credits) VALUES
('b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Língua Portuguesa', 'PORT', 'Disciplina de Língua Portuguesa', 5),
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Ciências Naturais', 'CIEN', 'Disciplina de Ciências Naturais', 4),
('d3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'História', 'HIST', 'Disciplina de História de Angola e Mundial', 3),
('e4d5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Inglês', 'ING', 'Disciplina de Língua Inglesa', 3)
ON CONFLICT DO NOTHING;

-- 2) Create academic year 2025/2026 if not exists
INSERT INTO public.academic_years (id, name, start_date, end_date, is_current)
VALUES ('a5e6f7a8-b9c0-4e1f-2a3b-4c5d6e7f8a9b', '2025/2026', '2025-09-01', '2026-07-15', true)
ON CONFLICT DO NOTHING;

-- 3) Update classes to have academic year
UPDATE public.classes SET academic_year_id = '65cdbd06-0e90-4d58-a3f8-636a38a706ec' WHERE academic_year_id IS NULL;

-- 4) Create class_subjects - linking teachers to subjects and classes
-- Get teacher IDs and assign them
INSERT INTO public.class_subjects (class_id, subject_id, teacher_id, schedule) VALUES
-- 10A class subjects
('25cabadd-8ff5-42b6-977f-fc8dcb914060', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '7ddad894-a325-4b49-94e8-0ebfd5b272ec', '{"monday": "10:00-11:30", "wednesday": "10:00-11:30"}'::jsonb),
('25cabadd-8ff5-42b6-977f-fc8dcb914060', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'b0d42ffc-5963-466c-b511-a20d95ed33d4', '{"tuesday": "08:00-09:30", "thursday": "08:00-09:30"}'::jsonb),
('25cabadd-8ff5-42b6-977f-fc8dcb914060', 'd3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c620407f-eeb0-4ab7-82d9-4f3fbde441ae', '{"friday": "10:00-11:30"}'::jsonb),
-- 10B class subjects
('1c77792f-9704-4261-ac13-751ba05a7b31', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '7ddad894-a325-4b49-94e8-0ebfd5b272ec', '{"tuesday": "10:00-11:30", "thursday": "10:00-11:30"}'::jsonb),
('1c77792f-9704-4261-ac13-751ba05a7b31', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'b0d42ffc-5963-466c-b511-a20d95ed33d4', '{"monday": "08:00-09:30", "wednesday": "08:00-09:30"}'::jsonb),
-- 11A class subjects
('f68b9433-ebf1-49ab-afc7-b596a01b9bf9', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '7ddad894-a325-4b49-94e8-0ebfd5b272ec', '{"monday": "14:00-15:30", "wednesday": "14:00-15:30"}'::jsonb),
('f68b9433-ebf1-49ab-afc7-b596a01b9bf9', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'c620407f-eeb0-4ab7-82d9-4f3fbde441ae', '{"tuesday": "14:00-15:30", "thursday": "14:00-15:30"}'::jsonb),
-- 11B class subjects
('45b6e58c-dc52-4005-9c63-5ea895d3e660', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'b0d42ffc-5963-466c-b511-a20d95ed33d4', '{"monday": "10:00-11:30", "friday": "10:00-11:30"}'::jsonb),
('45b6e58c-dc52-4005-9c63-5ea895d3e660', 'd3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c620407f-eeb0-4ab7-82d9-4f3fbde441ae', '{"wednesday": "10:00-11:30"}'::jsonb),
-- 12A class subjects
('d67a2e48-588f-47c9-9e32-8a93d25bdcb0', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '7ddad894-a325-4b49-94e8-0ebfd5b272ec', '{"monday": "08:00-09:30", "wednesday": "08:00-09:30"}'::jsonb),
('d67a2e48-588f-47c9-9e32-8a93d25bdcb0', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'b0d42ffc-5963-466c-b511-a20d95ed33d4', '{"tuesday": "10:00-11:30", "thursday": "10:00-11:30"}'::jsonb),
('d67a2e48-588f-47c9-9e32-8a93d25bdcb0', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'c620407f-eeb0-4ab7-82d9-4f3fbde441ae', '{"friday": "08:00-09:30"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Update existing class_subject with teacher
UPDATE public.class_subjects 
SET teacher_id = '7ddad894-a325-4b49-94e8-0ebfd5b272ec'
WHERE id = 'cb6cfd1f-5378-4b95-bfc7-c3f63f80b471' AND teacher_id IS NULL;

-- 5) Create GRADES for students
-- Students in 10A (João Pedro Silva, Maria Fernanda Santos)
INSERT INTO public.grades (student_id, subject_id, class_id, period, grade, description, created_by) VALUES
-- João Pedro Silva
('2d7cc32f-ef4a-4bc3-b14f-ea19ce49238a', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '25cabadd-8ff5-42b6-977f-fc8dcb914060', '1_trimestre', 16, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('2d7cc32f-ef4a-4bc3-b14f-ea19ce49238a', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '25cabadd-8ff5-42b6-977f-fc8dcb914060', '1_trimestre', 14, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),
-- Maria Fernanda Santos
('4a4e1344-e458-4642-901e-0262bbf8cb72', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '25cabadd-8ff5-42b6-977f-fc8dcb914060', '1_trimestre', 18, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('4a4e1344-e458-4642-901e-0262bbf8cb72', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '25cabadd-8ff5-42b6-977f-fc8dcb914060', '1_trimestre', 15, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),

-- Students in 10B (Carlos Alberto Mendes, Ana Beatriz Costa)
('37f8083b-18e1-430a-9dbb-a91360d2e8e6', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '1c77792f-9704-4261-ac13-751ba05a7b31', '1_trimestre', 12, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('37f8083b-18e1-430a-9dbb-a91360d2e8e6', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '1c77792f-9704-4261-ac13-751ba05a7b31', '1_trimestre', 17, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),
('589552cf-83e3-4f33-b66a-96f0eaf3663a', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', '1c77792f-9704-4261-ac13-751ba05a7b31', '1_trimestre', 14, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('589552cf-83e3-4f33-b66a-96f0eaf3663a', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '1c77792f-9704-4261-ac13-751ba05a7b31', '1_trimestre', 16, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),

-- Students in 11A (Pedro Miguel Andrade, Sofia Helena Lopes)
('fe911472-19e5-4a90-afe6-56d1757e1650', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', 'f68b9433-ebf1-49ab-afc7-b596a01b9bf9', '1_trimestre', 15, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('fe911472-19e5-4a90-afe6-56d1757e1650', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'f68b9433-ebf1-49ab-afc7-b596a01b9bf9', '1_trimestre', 17, 'Prova Ciências 1º Trimestre', '58d19292-8d13-417d-8dc7-c2856ba6e08c'),
('8875ffe1-59b1-4814-95a8-d48c365cff49', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', 'f68b9433-ebf1-49ab-afc7-b596a01b9bf9', '1_trimestre', 19, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('8875ffe1-59b1-4814-95a8-d48c365cff49', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'f68b9433-ebf1-49ab-afc7-b596a01b9bf9', '1_trimestre', 18, 'Prova Ciências 1º Trimestre', '58d19292-8d13-417d-8dc7-c2856ba6e08c'),

-- Students in 11B (Miguel Ângelo Ferreira, Luísa Maria Pereira)
('36dbefec-c64a-44b3-a4c2-2618838fe7cf', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '45b6e58c-dc52-4005-9c63-5ea895d3e660', '1_trimestre', 13, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),
('36dbefec-c64a-44b3-a4c2-2618838fe7cf', 'd3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '45b6e58c-dc52-4005-9c63-5ea895d3e660', '1_trimestre', 16, 'Prova História 1º Trimestre', '58d19292-8d13-417d-8dc7-c2856ba6e08c'),
('35989d5a-6dfc-4d3b-820f-ea1dc84e8f32', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '45b6e58c-dc52-4005-9c63-5ea895d3e660', '1_trimestre', 15, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),
('35989d5a-6dfc-4d3b-820f-ea1dc84e8f32', 'd3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '45b6e58c-dc52-4005-9c63-5ea895d3e660', '1_trimestre', 14, 'Prova História 1º Trimestre', '58d19292-8d13-417d-8dc7-c2856ba6e08c'),

-- Students in 12A (André Paulo Gomes, Beatriz Isabel Neves)
('6d78fbce-0a84-4dc5-a0ee-311ed78dbc74', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', 'd67a2e48-588f-47c9-9e32-8a93d25bdcb0', '1_trimestre', 17, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('6d78fbce-0a84-4dc5-a0ee-311ed78dbc74', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd67a2e48-588f-47c9-9e32-8a93d25bdcb0', '1_trimestre', 16, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff'),
('3c939a2c-3a12-467a-aa1f-2c3c972ea251', 'a6c82698-40cc-4846-9ab3-dda1f574f73b', 'd67a2e48-588f-47c9-9e32-8a93d25bdcb0', '1_trimestre', 15, 'Prova Matemática 1º Trimestre', '4cb92381-00b2-4dbf-b137-d425bbeaf743'),
('3c939a2c-3a12-467a-aa1f-2c3c972ea251', 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd67a2e48-588f-47c9-9e32-8a93d25bdcb0', '1_trimestre', 18, 'Prova Português 1º Trimestre', 'd2d73da4-8438-4ed5-9e4c-3de5bffdefff');

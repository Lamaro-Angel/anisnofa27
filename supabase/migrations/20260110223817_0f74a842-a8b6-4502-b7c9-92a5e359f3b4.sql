
-- Remove all test data in correct order (respecting foreign keys)

-- 1. Delete tuition payments
DELETE FROM public.tuition_payments;

-- 2. Delete grades
DELETE FROM public.grades;

-- 3. Delete attendance
DELETE FROM public.attendance;

-- 4. Delete assignment submissions
DELETE FROM public.assignment_submissions;

-- 5. Delete assignments
DELETE FROM public.assignments;

-- 6. Delete guardian-student relationships
DELETE FROM public.guardian_students;

-- 7. Delete class subjects
DELETE FROM public.class_subjects;

-- 8. Delete students
DELETE FROM public.students;

-- 9. Delete teachers
DELETE FROM public.teachers;

-- 10. Delete guardians
DELETE FROM public.guardians;

-- 11. Delete user roles
DELETE FROM public.user_roles;

-- 12. Delete profiles
DELETE FROM public.profiles;

-- 13. Delete classes
DELETE FROM public.classes;

-- 14. Delete subjects
DELETE FROM public.subjects;

-- 15. Delete academic years
DELETE FROM public.academic_years;

-- 16. Delete announcements
DELETE FROM public.announcements;

-- 17. Delete messages
DELETE FROM public.messages;

-- 18. Delete contact requests
DELETE FROM public.contact_requests;

-- 19. Delete activity logs
DELETE FROM public.activity_logs;

-- 20. Delete student rankings
DELETE FROM public.student_rankings;

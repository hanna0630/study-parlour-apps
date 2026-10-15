-- Study Parlour core: roles, student access, enrollments, append-only credit ledger.
create type app_role as enum ('owner','administrator','tutor','parent','student');
create type credit_kind as enum ('issue','consume','restore','adjust','expire');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'parent',
  full_name text not null default '',
  locale text not null default 'en' check (locale in ('en','id')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table admin_permissions (
  admin_id uuid references profiles(id) on delete cascade,
  permission text not null,
  primary key (admin_id, permission)
);
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id),
  full_name text not null,
  date_of_birth date,
  created_at timestamptz not null default now()
);
create table guardian_links (
  guardian_id uuid references profiles(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  verified boolean not null default false,
  primary key (guardian_id, student_id)
);
create table tutor_assignments (
  tutor_id uuid references profiles(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  primary key (tutor_id, student_id)
);
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  status text not null default 'draft' check (status in
    ('draft','submitted','awaiting_guardian','awaiting_review','awaiting_pricing','awaiting_payment','active','rejected','suspended','cancelled')),
  subject text not null,
  class_type text not null check (class_type in ('private','group')),
  price_minor bigint not null check (price_minor >= 0),
  currency char(3) not null,
  created_at timestamptz not null default now()
);
create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id),
  student_id uuid not null references students(id),
  kind credit_kind not null,
  delta int not null check (delta <> 0),
  reason text not null,
  lesson_id uuid,
  idempotency_key text not null unique,
  actor uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on credit_ledger (enrollment_id);

create function forbid_change() returns trigger language plpgsql as
$$ begin raise exception 'credit_ledger is append-only'; end $$;
create trigger ledger_immutable before update or delete on credit_ledger
  for each row execute function forbid_change();

create view credit_balances with (security_invoker = true) as
  select enrollment_id, student_id, sum(delta)::int as balance
  from credit_ledger group by enrollment_id, student_id;

create function my_role() returns app_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and is_active $$;
create function has_perm(p text) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(my_role() = 'owner', false) or exists
   (select 1 from admin_permissions where admin_id = auth.uid() and permission = p) $$;
create function can_view_student(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(my_role() in ('owner','administrator'), false)
    or exists (select 1 from students where id = sid and user_id = auth.uid())
    or exists (select 1 from guardian_links where student_id = sid and guardian_id = auth.uid() and verified)
    or exists (select 1 from tutor_assignments where student_id = sid and tutor_id = auth.uid()) $$;

alter table profiles enable row level security;
alter table admin_permissions enable row level security;
alter table students enable row level security;
alter table guardian_links enable row level security;
alter table tutor_assignments enable row level security;
alter table enrollments enable row level security;
alter table credit_ledger enable row level security;

create policy profiles_self on profiles for select using (id = auth.uid() or my_role() in ('owner','administrator'));
create policy perms_read on admin_permissions for select using (admin_id = auth.uid() or my_role() = 'owner');
create policy perms_owner_write on admin_permissions for all using (my_role() = 'owner') with check (my_role() = 'owner');
create policy students_read on students for select using (can_view_student(id));
create policy students_write on students for all using (has_perm('students.manage')) with check (has_perm('students.manage'));
create policy guardians_read on guardian_links for select using (guardian_id = auth.uid() or my_role() in ('owner','administrator'));
create policy assign_read on tutor_assignments for select using (tutor_id = auth.uid() or my_role() in ('owner','administrator'));
create policy enroll_read on enrollments for select using (can_view_student(student_id));
create policy ledger_read on credit_ledger for select using (can_view_student(student_id));
-- No write policies on credit_ledger: writes only via record_credit().

create function record_credit(p_enrollment uuid, p_kind credit_kind, p_delta int, p_reason text,
                              p_lesson uuid, p_key text) returns uuid
language plpgsql security definer set search_path = public as $$
declare e enrollments; bal int; new_id uuid; existing uuid;
begin
  if not (has_perm('attendance.record') or my_role() = 'tutor') then raise exception 'not authorized'; end if;
  select id into existing from credit_ledger where idempotency_key = p_key;
  if existing is not null then return existing; end if;
  select * into e from enrollments where id = p_enrollment for update;
  if not found then raise exception 'enrollment not found'; end if;
  if p_kind in ('issue','adjust') and not has_perm('credits.adjust') then raise exception 'not authorized'; end if;
  if p_kind = 'issue' and e.status <> 'active' then raise exception 'enrollment not active'; end if;
  select coalesce(sum(delta),0) into bal from credit_ledger where enrollment_id = p_enrollment;
  if bal + p_delta < 0 then raise exception 'insufficient credits'; end if;
  insert into credit_ledger(enrollment_id, student_id, kind, delta, reason, lesson_id, idempotency_key, actor)
  values (p_enrollment, e.student_id, p_kind, p_delta, p_reason, p_lesson, p_key, auth.uid())
  returning id into new_id;
  return new_id;
end $$;

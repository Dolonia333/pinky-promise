create table if not exists builder_profiles (
  id text primary key,
  user_id text not null,
  analyzer_version text not null,
  sources jsonb not null,
  window_from text,
  window_to text,
  counts jsonb not null,
  signals jsonb not null,
  scores jsonb not null,
  confidence jsonb not null,
  background text not null default 'technical',
  display_name text not null default '',
  demo boolean not null default false,
  rating smallint,
  created_at timestamptz not null default now()
);
create index if not exists builder_profiles_user_idx on builder_profiles (user_id, created_at desc);

create table if not exists upload_codes (
  code text primary key,
  user_id text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists share_links (
  token text primary key,
  owner_user_id text not null,
  profile_id text not null,
  expires_at timestamptz not null,
  used_by text,
  report_id text,
  created_at timestamptz not null default now()
);

create table if not exists pair_reports (
  id text primary key,
  user_a text not null,
  user_b text not null,
  name_a text not null,
  name_b text not null,
  headline text not null,
  archetype text not null,
  archetype_line text not null,
  complements jsonb not null,
  frictions jsonb not null,
  next_step text not null,
  numbers jsonb not null,
  confidence_note text not null,
  created_at timestamptz not null default now()
);
create index if not exists pair_reports_user_a_idx on pair_reports (user_a);
create index if not exists pair_reports_user_b_idx on pair_reports (user_b);

create table if not exists challenge_sessions (
  id text primary key,
  user_id text not null,
  domain text not null,
  title text not null,
  brief text not null,
  seed text not null,
  status text not null default 'open',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  profile_id text
);
create index if not exists challenge_sessions_user_idx on challenge_sessions (user_id, started_at desc);

create table if not exists challenge_events (
  id text primary key,
  session_id text not null,
  user_id text not null,
  type text not null,
  section text,
  card_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists challenge_events_session_idx on challenge_events (session_id, created_at);

create table if not exists app_feedback (
  id text primary key,
  user_id text not null,
  page text not null,
  body text not null,
  created_at timestamptz not null default now()
);

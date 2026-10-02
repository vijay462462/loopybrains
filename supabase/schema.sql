-- RGUKT Spark: Supabase schema, security rules and storage.
--
-- HOW TO USE
--  1. Supabase dashboard > Authentication > Providers > turn ON "Allow anonymous sign-ins".
--  2. SQL Editor > New query > paste this whole file > Run. It is safe to run again.
--  3. Copy Project URL and the anon public key into docs/config.js (supabase: { url, anonKey }).
--  4. To make yourself an admin, run:  insert into public.spark_admins(user_id) values ('<your id>');
--     (your id is shown in the app: Profile > "Are you an IIT mentor?" > Copy ID)
--
-- SECURITY MODEL
--  * Every visitor signs in anonymously and gets a real user id. Row Level Security uses that id.
--  * A row's owner and creation time are set by the server, never by the browser.
--  * The author id inside a post must equal the signed-in user, so nobody can post as someone else.
--  * Only the owner (or an admin) can edit or soft-delete a row. Real deletes are blocked, except
--    for your own likes. Reports go through a function that adds only YOUR id.
--  * Every document is checked for allowed fields, types and sizes. Challenge questions,
--    author ids and timestamps cannot be changed after posting.
--  * Server-side rate limits stop spam even if someone calls the API directly.
--  * Alumni approvals can only be written by admins.

-- ---------- admins ----------
create table if not exists public.spark_admins (
  user_id uuid primary key,
  note text
);
alter table public.spark_admins enable row level security;   -- no policies: not readable through the API

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.spark_admins a where a.user_id = auth.uid())
$$;

-- ---------- documents ----------
create table if not exists public.spark_docs (
  coll text not null check (coll in ('doubts','ideas','clubs','gate','challenges','jobs','replies','likes','pages',
                                     'market','marketReports','marketRatings','marketInterests','chal_scores')),
  id text not null check (char_length(id) between 1 and 220),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 900000),
  owner uuid,
  created_at timestamptz not null default now(),
  primary key (coll, id)
);
create index if not exists spark_docs_coll_created on public.spark_docs (coll, created_at desc);
create index if not exists spark_docs_owner on public.spark_docs (owner, created_at desc);

-- ---------- validation helpers ----------
create or replace function public._txt(d jsonb, k text, mn int, mx int) returns boolean
language sql immutable as $$
  select jsonb_typeof(d->k) = 'string' and char_length(d->>k) between mn and mx
$$;
create or replace function public._otxt(d jsonb, k text, mx int) returns boolean
language sql immutable as $$
  select not (d ? k) or d->k = 'null'::jsonb or (jsonb_typeof(d->k) = 'string' and char_length(d->>k) <= mx)
$$;
create or replace function public._obool(d jsonb, k text) returns boolean
language sql immutable as $$ select not (d ? k) or jsonb_typeof(d->k) = 'boolean' $$;
create or replace function public._olist(d jsonb, k text, n int) returns boolean
language sql immutable as $$
  select not (d ? k) or (jsonb_typeof(d->k) = 'array' and jsonb_array_length(d->k) <= n)
$$;
create or replace function public._onum(d jsonb, k text, mn numeric, mx numeric) returns boolean
language sql immutable as $$
  select not (d ? k) or d->k = 'null'::jsonb or (jsonb_typeof(d->k) = 'number' and (d->>k)::numeric between mn and mx)
$$;
create or replace function public._keys(d jsonb, allowed text[]) returns boolean
language sql immutable as $$
  select not exists (select 1 from jsonb_object_keys(d) k where k <> all (allowed))
$$;
create or replace function public._recent(d jsonb, k text) returns boolean
language sql stable as $$
  select jsonb_typeof(d->k) = 'number'
     and (d->>k)::numeric between extract(epoch from now()) * 1000 - 1800000 and extract(epoch from now()) * 1000 + 1800000
$$;

-- The field that holds the user's id in each collection (must equal the signed-in user on insert).
create or replace function public._identity_key(p_coll text) returns text
language sql immutable as $$
  select case p_coll
    when 'likes' then 'uid' when 'marketReports' then 'reporterId' when 'marketRatings' then 'raterId'
    when 'marketInterests' then 'buyerId' when 'chal_scores' then 'userId' when 'pages' then null
    else 'authorId' end
$$;

-- Full document check. p_new is true on insert (also checks the timestamp).
create or replace function public.spark_valid(p_coll text, p_id text, d jsonb, p_new boolean) returns boolean
language plpgsql stable as $$
declare
  g text; ok boolean;
begin
  if p_coll in ('doubts','ideas','clubs','gate','challenges','jobs') then
    g := case p_coll when 'ideas' then 'category' when 'clubs' then 'club' when 'challenges' then 'type' when 'jobs' then 'type' else 'subject' end;
    ok := public._keys(d, array['title','body',g,'authorId','authorName','anonymous','urgent','createdAt','pages',
            'fileAttachments','year','tags','pyqYear','marks','difficulty','resolvedReplyId','bounty','campus',
            'chalType','timeLimit','questions','status','winner','winnerName','runnerUp','runnerUpName',
            'deleted','reports','editedAt','company','applyUrl','deadline','pay'])
      and public._txt(d,'title',3,200) and public._txt(d,'body',0,5000) and public._txt(d,g,1,60)
      and public._txt(d,'authorName',1,40) and public._txt(d,'authorId',8,80) and jsonb_typeof(d->'createdAt') = 'number'
      and public._obool(d,'anonymous') and public._obool(d,'urgent') and public._obool(d,'bounty') and public._obool(d,'deleted')
      and public._olist(d,'pages',5) and public._olist(d,'fileAttachments',5) and public._olist(d,'reports',100)
      and public._olist(d,'questions',10)
      and public._otxt(d,'year',12) and public._otxt(d,'tags',100) and public._otxt(d,'pyqYear',20) and public._otxt(d,'marks',4)
      and public._otxt(d,'difficulty',10) and public._otxt(d,'campus',30) and public._otxt(d,'chalType',20)
      and public._otxt(d,'company',60) and public._otxt(d,'applyUrl',300) and public._otxt(d,'deadline',10) and public._otxt(d,'pay',40)
      and public._otxt(d,'winner',100) and public._otxt(d,'winnerName',40) and public._otxt(d,'runnerUp',100)
      and public._otxt(d,'runnerUpName',40) and public._otxt(d,'resolvedReplyId',100)
      and public._onum(d,'timeLimit',0,180) and public._onum(d,'editedAt',0,9e15)
      and (not (d ? 'status') or d->>'status' in ('open','closed'));
    if p_new then
      ok := ok and public._recent(d,'createdAt') and coalesce((d->>'deleted')::boolean, false) = false and not (d ? 'reports');
    end if;
    return ok;

  elsif p_coll = 'replies' then
    ok := public._keys(d, array['parentId','parentColl','body','authorId','authorName','anonymous','createdAt','pages',
            'fileAttachments','deleted','reports'])
      and public._txt(d,'body',1,5000) and public._txt(d,'authorName',1,40) and public._txt(d,'authorId',8,80)
      and d->>'parentColl' in ('doubts','ideas','clubs','gate','challenges','jobs','market') and public._txt(d,'parentId',1,100)
      and jsonb_typeof(d->'createdAt') = 'number' and public._obool(d,'anonymous') and public._obool(d,'deleted')
      and public._olist(d,'pages',5) and public._olist(d,'fileAttachments',5) and public._olist(d,'reports',100);
    if p_new then
      ok := ok and public._recent(d,'createdAt') and coalesce((d->>'deleted')::boolean, false) = false and not (d ? 'reports');
    end if;
    return ok;

  elsif p_coll = 'pages' then
    return public._keys(d, array['data','parentId','createdAt']) and public._txt(d,'data',30,750000)
      and left(d->>'data', 11) = 'data:image/' and public._txt(d,'parentId',1,100)
      and (not p_new or public._recent(d,'createdAt'));

  elsif p_coll = 'likes' then
    -- alumni approvals and other special keys: only admins may write the alumni approval key
    return public._keys(d, array['ideaId','uid','createdAt','name']) and public._txt(d,'uid',8,80)
      and public._txt(d,'ideaId',1,200) and p_id = (d->>'ideaId') || '_' || (d->>'uid')
      and (not p_new or public._recent(d,'createdAt')) and public._otxt(d,'name',40)
      and (left(d->>'ideaId', 10) <> 'alumni~ok~' or public.is_admin());

  elsif p_coll = 'market' then
    ok := public._keys(d, array['title','body','category','price','condition','whatsapp','authorId','authorName','sold',
            'createdAt','campus','deleted','reports'])
      and public._txt(d,'title',3,200) and public._txt(d,'body',0,2000) and public._txt(d,'category',1,40)
      and public._onum(d,'price',0,10000000) and public._otxt(d,'condition',40) and public._otxt(d,'whatsapp',10)
      and public._otxt(d,'campus',30) and public._txt(d,'authorName',1,40) and public._txt(d,'authorId',8,80)
      and jsonb_typeof(d->'createdAt') = 'number' and public._obool(d,'sold') and public._obool(d,'deleted')
      and public._olist(d,'reports',100);
    if p_new then
      ok := ok and public._recent(d,'createdAt') and coalesce((d->>'deleted')::boolean, false) = false and not (d ? 'reports');
    end if;
    return ok;

  elsif p_coll = 'marketReports' then
    return public._keys(d, array['listingId','sellerId','reporterId','reason','createdAt'])
      and public._txt(d,'listingId',1,100) and public._txt(d,'sellerId',8,80) and public._txt(d,'reporterId',8,80)
      and public._txt(d,'reason',1,120) and (not p_new or public._recent(d,'createdAt'));

  elsif p_coll = 'marketRatings' then
    return public._keys(d, array['listingId','sellerId','raterId','score','createdAt'])
      and public._txt(d,'listingId',1,100) and public._txt(d,'sellerId',8,80) and public._txt(d,'raterId',8,80)
      and jsonb_typeof(d->'score') = 'number' and (d->>'score')::numeric between 1 and 5
      and (not p_new or public._recent(d,'createdAt'));

  elsif p_coll = 'marketInterests' then
    return public._keys(d, array['listingId','sellerId','buyerId','buyerName','buyerCampus','createdAt','deleted'])
      and public._txt(d,'listingId',1,100) and public._txt(d,'sellerId',8,80) and public._txt(d,'buyerId',8,80)
      and public._txt(d,'buyerName',1,40) and public._otxt(d,'buyerCampus',30) and public._obool(d,'deleted')
      and (not p_new or public._recent(d,'createdAt'));

  elsif p_coll = 'chal_scores' then
    return public._keys(d, array['challengeId','userId','userName','score','timeTaken','answers','submittedAt'])
      and public._txt(d,'challengeId',1,100) and public._txt(d,'userId',8,80) and public._txt(d,'userName',1,40)
      and p_id = (d->>'challengeId') || '_' || (d->>'userId')
      and jsonb_typeof(d->'score') = 'number' and (d->>'score')::numeric between 0 and 1000
      and jsonb_typeof(d->'timeTaken') = 'number' and (d->>'timeTaken')::numeric >= 0
      and jsonb_typeof(d->'answers') = 'array' and jsonb_array_length(d->'answers') <= 10
      and (not p_new or public._recent(d,'submittedAt'));
  end if;
  return false;
end $$;

-- ---------- server-side rules: owner, time, immutability, rate limits ----------
create or replace function public.spark_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  k text; n int; gap interval; grp text[]; lim int;
begin
  if tg_op = 'INSERT' then
    if uid is not null then               -- normal API call; migrations from the SQL editor skip this block
      new.owner := uid;
      new.created_at := now();
      k := public._identity_key(new.coll);
      if k is not null and (new.data->>k) is distinct from uid::text then
        raise exception 'You can only write as yourself' using errcode = '42501';
      end if;
      if not public.is_admin() then
        grp := case
          when new.coll in ('doubts','ideas','clubs','gate','challenges','jobs','market') then array['doubts','ideas','clubs','gate','challenges','jobs','market']
          when new.coll = 'replies' then array['replies']
          when new.coll = 'likes' then array['likes']
          when new.coll = 'pages' then array['pages']
          else array[new.coll] end;
        lim := case
          when new.coll in ('doubts','ideas','clubs','gate','challenges','jobs','market') then 15
          when new.coll = 'replies' then 40
          when new.coll = 'likes' then 400
          when new.coll = 'pages' then 60
          else 60 end;
        select count(*) into n from public.spark_docs
          where owner = uid and coll = any (grp) and created_at > now() - interval '1 hour';
        if n >= lim then raise exception 'Too many posts. Please wait a while and try again.' using errcode = '42501'; end if;
        if new.coll in ('doubts','ideas','clubs','gate','challenges','jobs','market','replies') then
          select count(*) into n from public.spark_docs
            where owner = uid and coll = any (grp) and created_at > now() - interval '8 seconds';
          if n > 0 then raise exception 'Slow down a little before posting again.' using errcode = '42501'; end if;
        end if;
      end if;
    end if;
    return new;
  end if;

  -- UPDATE
  if uid is not null and (new.coll is distinct from old.coll or new.id is distinct from old.id
     or new.owner is distinct from old.owner or new.created_at is distinct from old.created_at) then
    raise exception 'Protected fields cannot change' using errcode = '42501';
  end if;
  if uid is not null and not public.is_admin() then
    foreach k in array array['authorId','createdAt','uid','parentId','parentColl','listingId','sellerId','buyerId',
                             'raterId','reporterId','challengeId','userId','ideaId','questions','chalType','timeLimit'] loop
      if (new.data->k) is distinct from (old.data->k) then
        raise exception 'The field % cannot be changed after posting', k using errcode = '42501';
      end if;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists spark_before_write on public.spark_docs;
create trigger spark_before_write before insert or update on public.spark_docs
  for each row execute function public.spark_before_write();

-- ---------- Row Level Security ----------
alter table public.spark_docs enable row level security;
revoke all on public.spark_docs from anon;
grant select, insert, update, delete on public.spark_docs to authenticated;

drop policy if exists spark_read on public.spark_docs;
create policy spark_read on public.spark_docs for select to authenticated using (true);

drop policy if exists spark_insert on public.spark_docs;
create policy spark_insert on public.spark_docs for insert to authenticated
  with check (public.spark_valid(coll, id, data, true));

drop policy if exists spark_update on public.spark_docs;
create policy spark_update on public.spark_docs for update to authenticated
  using (owner = auth.uid() or public.is_admin())
  with check (public.spark_valid(coll, id, data, false));

-- Real deletes: only your own likes (un-like), or an admin.
drop policy if exists spark_delete on public.spark_docs;
create policy spark_delete on public.spark_docs for delete to authenticated
  using ((coll = 'likes' and owner = auth.uid()) or public.is_admin());

-- ---------- helper functions the app calls ----------
-- Merge a few fields into a document. Runs with the caller's rights, so Row Level Security applies.
create or replace function public.spark_patch(p_coll text, p_id text, p_patch jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  update public.spark_docs set data = data || p_patch where coll = p_coll and id = p_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Not allowed, or the post no longer exists' using errcode = '42501'; end if;
end $$;

-- Anyone can report a post, but only their own id is added (once).
create or replace function public.spark_report(p_coll text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare uid text := auth.uid()::text;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_coll not in ('doubts','ideas','clubs','gate','challenges','jobs','replies','market') then
    raise exception 'Cannot report this' using errcode = '42501';
  end if;
  update public.spark_docs
     set data = jsonb_set(data, '{reports}',
           coalesce(data->'reports', '[]'::jsonb) || to_jsonb(uid))
   where coll = p_coll and id = p_id
     and coalesce(jsonb_array_length(data->'reports'), 0) < 100
     and not (coalesce(data->'reports', '[]'::jsonb) ? uid);
end $$;

revoke all on function public.spark_patch(text, text, jsonb) from public, anon;
revoke all on function public.spark_report(text, text) from public, anon;
grant execute on function public.spark_patch(text, text, jsonb) to authenticated;
grant execute on function public.spark_report(text, text) to authenticated;

-- ---------- realtime ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'spark_docs') then
    alter publication supabase_realtime add table public.spark_docs;
  end if;
end $$;

-- ---------- file uploads (PDF, images, Office and text files only) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 20971520, array[
  'application/pdf','image/png','image/jpeg','image/gif','image/webp','text/plain','text/csv',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists spark_uploads_insert on storage.objects;
create policy spark_uploads_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

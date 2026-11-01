-- =====================================================================
-- Tela de membros (docs/PLANO_TECNICO.md §17)
-- 1. E-mail no perfil, para a lista de membros (auth.users não é lido pelo app)
-- 2. A organização nunca fica sem administrador
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles.email
-- Visível só para o próprio usuário e colegas (policy de select já existente).
-- Ninguém edita pelo app: o grant de update continua só em full_name.
-- ---------------------------------------------------------------------

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), new.email);
  return new;
end;
$$;

-- Troca de e-mail na conta (Supabase Auth) chega ao perfil
create function private.sync_profile_email()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function private.sync_profile_email();

-- ---------------------------------------------------------------------
-- 2. Último administrador
-- Bloqueia rebaixar ou remover o último admin. Não bloqueia quando a
-- organização ou o perfil estão sendo apagados (exclusão em cascata).
-- ---------------------------------------------------------------------

create function private.keep_one_admin()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role <> 'admin')
     and exists (select 1 from public.organizations where id = old.organization_id)
     and exists (select 1 from public.profiles where id = old.user_id)
     and not exists (
       select 1 from public.organization_members
       where organization_id = old.organization_id
         and role = 'admin'
         and user_id <> old.user_id
     )
  then
    raise exception 'A organização precisa de pelo menos um administrador.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger keep_one_admin
  before update of role or delete on public.organization_members
  for each row execute function private.keep_one_admin();

-- Funções de trigger: ninguém chama direto
revoke all on function
  private.sync_profile_email(),
  private.keep_one_admin()
from public, anon, authenticated;

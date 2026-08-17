CREATE TABLE public.creation_contacts (
  creation_id uuid PRIMARY KEY REFERENCES public.creations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creation_contacts TO authenticated;
GRANT ALL ON public.creation_contacts TO service_role;

ALTER TABLE public.creation_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY creation_contacts_read_authenticated ON public.creation_contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY creation_contacts_insert_own ON public.creation_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY creation_contacts_update_own ON public.creation_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY creation_contacts_delete_own ON public.creation_contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.creation_contacts (creation_id, user_id, contact)
SELECT id, user_id, contact FROM public.creations WHERE contact IS NOT NULL AND btrim(contact) <> '';

ALTER TABLE public.creations DROP COLUMN contact;
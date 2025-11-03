-- Enable realtime for intelligence snapshot tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_engine_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gane_engine_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moro_engine_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.graph_context_cache;
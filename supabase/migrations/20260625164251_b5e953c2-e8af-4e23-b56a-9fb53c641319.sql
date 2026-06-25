
CREATE POLICY "Admins manage product-files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-files' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'product-files' AND has_role(auth.uid(),'admin'));

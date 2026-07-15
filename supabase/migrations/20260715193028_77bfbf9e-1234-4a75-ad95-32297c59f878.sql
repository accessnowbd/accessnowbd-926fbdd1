UPDATE public.admin_records
SET data = data
  || jsonb_build_object(
    'thankYouText', 'AccessNow BD থেকে কেনার জন্য ধন্যবাদ! যেকোনো সমস্যায় WhatsApp: 01580607614',
    'footerNote', 'This is a computer-generated invoice from AccessNow BD (accessnowbd.com) and does not require a signature.'
  )
WHERE kind = 'invoice_design';
UPDATE public.telegram_settings
SET config = jsonb_set(
  config,
  '{templates,order_created}',
  to_jsonb($tpl$🆕 <b>নতুন অর্ডার!</b>
📋 Order: <code>{{order_id}}</code>
🕒 {{time}}

👤 <b>Customer</b>
Name: {{customer}}
Phone: {{phone}}
Email: {{email}}

📦 <b>Items ({{items_count}})</b>
{{items}}

💵 <b>Payment</b>
Subtotal: ৳{{subtotal}}
Discount: ৳{{discount}} ({{coupon}})
Wallet: ৳{{wallet}}
<b>Total: ৳{{total}}</b>
Method: {{payment_method}}
Sender: {{sender_number}}
TxID: <code>{{transaction_id}}</code>

🔗 <a href="{{admin_url}}">Admin panel-এ দেখুন</a>$tpl$::text)
)
WHERE kind = 'order_bot';
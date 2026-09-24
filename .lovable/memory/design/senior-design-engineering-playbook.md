---
name: Senior design and engineering playbook
description: Persistent workflow for AI-generated AccessNow BD website design and implementation
type: design
---

# AccessNow BD — Senior Design & Engineering Playbook

AI যখন নতুন page, feature, redesign বা bug fix করবে, তখন এই sequence অনুসরণ করবে:

1. **Context audit:** সংশ্লিষ্ট route, existing components, tokens, data contract, auth/RLS boundary, tests এবং এই memory folder-এর related decisions পড়বে।
2. **Experience brief:** user goal, business outcome, primary CTA, content hierarchy, responsive behavior এবং loading/empty/error/success states নির্ধারণ করবে।
3. **System-first design:** existing purple-led brand, neutral surfaces, readable typography, spacing rhythm, rounded controls, restrained shadows এবং semantic status colors reuse করবে। Existing pattern না থাকলে প্রথমে reusable token/component তৈরি করবে।
4. **Responsive implementation:** mobile-first layout, 44px touch targets, keyboard/focus states, Bengali text wrapping, narrow tables এবং reduced-motion behavior ঠিক করবে।
5. **Production behavior:** permission, validation, failure recovery, optimistic/pending state, destructive confirmation এবং user-facing notifications সম্পূর্ণ করবে।
6. **Quality gate:** targeted tests/lint/build এবং প্রয়োজন হলে accessibility check চালাবে। Visual change হলে at least mobile এবং desktop viewport-এ interaction যাচাই করবে।
7. **Decision memory:** reusable নতুন pattern বা locked layout হলে এই folder-এ একটি ছোট decision note রাখবে; পুরনো decision অকারণে override করবে না।

## Design review checklist

- [ ] One clear primary action and predictable next step
- [ ] Hierarchy, spacing, alignment and typography are consistent
- [ ] No unnecessary decoration, animation or new visual token
- [ ] Loading, empty, error, disabled and success states exist
- [ ] Keyboard, focus, semantic labels and contrast are usable
- [ ] Mobile and desktop layouts preserve intent
- [ ] Existing components/helpers were reused where appropriate
- [ ] Relevant validation was run and any limitation is reported

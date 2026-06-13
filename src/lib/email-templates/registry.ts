import type { ComponentType } from 'react'

import { template as welcomeTemplate } from './welcome'
import { template as orderConfirmationTemplate } from './order-confirmation'
import { template as subscriptionActivatedTemplate } from './subscription-activated'
import { template as orderStatusUpdateTemplate } from './order-status-update'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names used by the send route to
 * their React Email component + metadata. Add new templates here after
 * creating the .tsx file in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcomeTemplate,
  'order-confirmation': orderConfirmationTemplate,
  'subscription-activated': subscriptionActivatedTemplate,
  'order-status-update': orderStatusUpdateTemplate,
}

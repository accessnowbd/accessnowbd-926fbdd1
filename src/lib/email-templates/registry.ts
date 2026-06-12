import type { ComponentType } from 'react'

import { template as welcome } from './welcome'
import { template as passwordChanged } from './password-changed'
import { template as newDeviceLogin } from './new-device-login'
import { template as subscriptionActivated } from './subscription-activated'
import { template as paymentSuccess } from './payment-success'
import { template as paymentFailed } from './payment-failed'
import { template as invoice } from './invoice'
import { template as subscriptionExpiring } from './subscription-expiring'
import { template as subscriptionCancelled } from './subscription-cancelled'
import { template as refundProcessed } from './refund-processed'
import { template as orderConfirmation } from './order-confirmation'
import { template as supportTicketReply } from './support-ticket-reply'
import { template as securityAlert } from './security-alert'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome,
  'password-changed': passwordChanged,
  'new-device-login': newDeviceLogin,
  'subscription-activated': subscriptionActivated,
  'payment-success': paymentSuccess,
  'payment-failed': paymentFailed,
  invoice,
  'subscription-expiring': subscriptionExpiring,
  'subscription-cancelled': subscriptionCancelled,
  'refund-processed': refundProcessed,
  'order-confirmation': orderConfirmation,
  'support-ticket-reply': supportTicketReply,
  'security-alert': securityAlert,
}

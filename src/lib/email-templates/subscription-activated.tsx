import * as React from 'react'
import { Button, Text, Hr } from '@react-email/components'
import { EmailLayout, styles } from './_layout'
import type { TemplateEntry } from './registry'

interface DownloadLinkItem {
  productName: string
  label?: string
  url: string
  note?: string
}

interface Props {
  name?: string
  planName?: string
  startsOn?: string
  expiresOn?: string
  loginEmail?: string
  loginPassword?: string
  manageUrl?: string
  downloadLinks?: DownloadLinkItem[]
}

const Email = ({
  name,
  planName,
  startsOn,
  expiresOn,
  loginEmail,
  loginPassword,
  manageUrl = 'https://accessnowbd.com/orders',
  downloadLinks = [],
}: Props) => (
  <EmailLayout
    preview={`Your ${planName ?? 'subscription'} is active`}
    heading="Subscription activated 🚀"
  >
    <Text style={styles.text}>
      Hi{name ? ` ${name}` : ''}, ধন্যবাদ! আপনার subscription সফলভাবে activate করা হয়েছে।
    </Text>
    <div style={styles.totalBox}>
      {planName && (
        <Text style={styles.row}>
          <span style={styles.label}>Plan:</span> {planName}
        </Text>
      )}
      {startsOn && (
        <Text style={styles.row}>
          <span style={styles.label}>Starts:</span> {startsOn}
        </Text>
      )}
      {expiresOn && (
        <Text style={styles.row}>
          <span style={styles.label}>Expires:</span> {expiresOn}
        </Text>
      )}
      {loginEmail && (
        <Text style={styles.row}>
          <span style={styles.label}>Login email:</span> {loginEmail}
        </Text>
      )}
      {loginPassword && (
        <Text style={styles.row}>
          <span style={styles.label}>Password:</span> {loginPassword}
        </Text>
      )}
    </div>

    {downloadLinks.length > 0 && (
      <>
        <Hr style={styles.hr} />
        <Text style={{ ...styles.text, fontWeight: 700, marginBottom: 6 }}>
          📥 Download Links
        </Text>
        <Text style={styles.muted}>
          নিচের লিংক থেকে আপনার product এর সেটআপ ফাইল / অ্যাপ ডাউনলোড করুন।
        </Text>
        {downloadLinks.map((d, i) => (
          <div key={i} style={{ ...styles.totalBox, marginTop: 8 }}>
            <Text style={{ ...styles.row, fontWeight: 700 }}>
              {d.productName}{d.label && d.label !== 'Download' ? ` — ${d.label}` : ''}
            </Text>
            <Button style={{ ...styles.button, padding: '10px 18px', fontSize: 13 }} href={d.url}>
              Download now
            </Button>
            {d.note && (
              <Text style={{ ...styles.muted, marginTop: 6 }}>{d.note}</Text>
            )}
          </div>
        ))}
      </>
    )}

    <Button style={styles.button} href={manageUrl}>
      Manage subscription
    </Button>
    <Text style={styles.muted}>
      Dashboard-এ গিয়ে সব download link এক জায়গায় পাবেন। Login করতে সমস্যা হলে WhatsApp-এ জানান।
    </Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Your subscription is now active 🚀',
  displayName: 'Subscription activated',
  previewData: {
    name: 'Rahim',
    planName: 'Netflix Premium (1 month)',
    startsOn: '12 Jun 2026',
    expiresOn: '12 Jul 2026',
    loginEmail: 'shared-account@accessnowbd.com',
    loginPassword: '••••••••',
    manageUrl: 'https://accessnowbd.com/orders',
    downloadLinks: [
      { productName: 'Netflix Premium', url: 'https://accessnowbd.com/downloads/netflix.apk', note: 'Android APK for smoother playback.' },
    ],
  },
} satisfies TemplateEntry

export default Email

import { pgTable, serial, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'

// Contacts — core table
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  // status: active | unsubscribed | bounced | complained | pending
  source: varchar('source', { length: 100 }),
  // source: pdf_download | survey | website_subscription | social_media | manual | other
  sourceFile: varchar('source_file', { length: 255 }),
  importBatchId: varchar('import_batch_id', { length: 100 }),
  engagementScore: integer('engagement_score').notNull().default(0),
  totalEmailsSent: integer('total_emails_sent').notNull().default(0),
  totalEmailsOpened: integer('total_emails_opened').notNull().default(0),
  totalEmailsClicked: integer('total_emails_clicked').notNull().default(0),
  lastEngagedAt: timestamp('last_engaged_at'),
  customFields: jsonb('custom_fields'),
  tags: jsonb('tags').$type<string[]>().default([]),
  consentGiven: boolean('consent_given').notNull().default(false),
  consentDate: timestamp('consent_date'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  bouncedAt: timestamp('bounced_at'),
  complainedAt: timestamp('complained_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('contacts_email_idx').on(table.email),
  statusIdx: index('contacts_status_idx').on(table.status),
  sourceIdx: index('contacts_source_idx').on(table.source),
}))

// Segments — named audience groups
export const segments = pgTable('segments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('custom'),
  // type: creator | learner | brand_fan | buyer | unknown | custom
  color: varchar('color', { length: 7 }).default('#F97316'),
  rules: jsonb('rules'),
  contactCount: integer('contact_count').notNull().default(0),
  lastCalculatedAt: timestamp('last_calculated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ContactSegments — many-to-many
export const contactSegments = pgTable('contact_segments', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  segmentId: integer('segment_id').notNull().references(() => segments.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').notNull().defaultNow(),
})

// Campaigns — one-time broadcast emails
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  previewText: varchar('preview_text', { length: 500 }),
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  // status: draft | scheduled | sending | sent | paused
  provider: varchar('provider', { length: 50 }).notNull().default('ses'),
  // provider: resend | ses
  segmentIds: jsonb('segment_ids').$type<number[]>().default([]),
  sendToAll: boolean('send_to_all').notNull().default(false),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  totalRecipients: integer('total_recipients').notNull().default(0),
  totalSent: integer('total_sent').notNull().default(0),
  totalDelivered: integer('total_delivered').notNull().default(0),
  totalOpened: integer('total_opened').notNull().default(0),
  totalClicked: integer('total_clicked').notNull().default(0),
  totalBounced: integer('total_bounced').notNull().default(0),
  totalUnsubscribed: integer('total_unsubscribed').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Sequences — drip campaign containers
export const sequences = pgTable('sequences', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  // status: active | paused | completed
  triggerTag: varchar('trigger_tag', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// SequenceEmails — individual emails in a drip sequence
export const sequenceEmails = pgTable('sequence_emails', {
  id: serial('id').primaryKey(),
  sequenceId: integer('sequence_id').notNull().references(() => sequences.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  delayDays: integer('delay_days').notNull().default(0),
  subject: varchar('subject', { length: 500 }).notNull(),
  previewText: varchar('preview_text', { length: 500 }),
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// SequenceEnrollments — tracks each contact's progress
export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: serial('id').primaryKey(),
  sequenceId: integer('sequence_id').notNull().references(() => sequences.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  currentStep: integer('current_step').notNull().default(1),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  // status: active | paused | completed
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  nextSendAt: timestamp('next_send_at'),
  completedAt: timestamp('completed_at'),
})

// EmailEvents — every email event
export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  sequenceEmailId: integer('sequence_email_id').references(() => sequenceEmails.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  // eventType: sent | delivered | opened | clicked | bounced | unsubscribed | complained | sale
  metadata: jsonb('metadata'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
}, (table) => ({
  contactIdx: index('email_events_contact_idx').on(table.contactId),
  eventTypeIdx: index('email_events_type_idx').on(table.eventType),
  occurredIdx: index('email_events_occurred_idx').on(table.occurredAt),
}))

// ImportBatches — audit trail for CSV imports
export const importBatches = pgTable('import_batches', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 100 }).notNull().unique(),
  fileName: varchar('file_name', { length: 255 }),
  source: varchar('source', { length: 100 }),
  totalRows: integer('total_rows').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  duplicateCount: integer('duplicate_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // status: pending | processing | done | failed
  errors: jsonb('errors').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

// RevenueEvents — dedicated sales tracking
export const revenueEvents = pgTable('revenue_events', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  sequenceEmailId: integer('sequence_email_id').references(() => sequenceEmails.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }),
  amountZar: integer('amount_zar').notNull().default(0),
  // amountZar in cents — 4700 = R47.00
  currency: varchar('currency', { length: 10 }).notNull().default('ZAR'),
  source: varchar('source', { length: 100 }),
  reference: varchar('reference', { length: 255 }),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// AbTests — A/B test results
export const abTests = pgTable('ab_tests', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  // status: active | completed | paused
  subjectA: varchar('subject_a', { length: 500 }).notNull(),
  subjectB: varchar('subject_b', { length: 500 }).notNull(),
  splitPct: integer('split_pct').notNull().default(50),
  sentA: integer('sent_a').notNull().default(0),
  openedA: integer('opened_a').notNull().default(0),
  clickedA: integer('clicked_a').notNull().default(0),
  sentB: integer('sent_b').notNull().default(0),
  openedB: integer('opened_b').notNull().default(0),
  clickedB: integer('clicked_b').notNull().default(0),
  winner: varchar('winner', { length: 1 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

// WebhookEvents — log all incoming webhooks
export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  // provider: resend | ses | paystack | gumroad
  eventType: varchar('event_type', { length: 100 }),
  email: varchar('email', { length: 255 }),
  payload: jsonb('payload'),
  processed: boolean('processed').notNull().default(false),
  error: text('error'),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
})


// User Email Configurations
export const userEmailConfigs = sqliteTable("user_email_configs", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emailAddress: text("email_address").notNull(),
    imapHost: text("imap_host").notNull(),
    imapPort: integer("imap_port").notNull(),
    imapSecure: integer("imap_secure", { mode: "boolean" }).notNull().default(true),
    smtpHost: text("smtp_host").notNull(),
    smtpPort: integer("smtp_port").notNull(),
    smtpSecure: integer("smtp_secure", { mode: "boolean" }).notNull().default(true),
    password: text("password").notNull(),
    displayName: text("display_name"),
    signature: text("signature"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
});

export const insertUserEmailConfigSchema = createInsertSchema(userEmailConfigs).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export type InsertUserEmailConfig = z.infer<typeof insertUserEmailConfigSchema>;
export type UserEmailConfig = typeof userEmailConfigs.$inferSelect;

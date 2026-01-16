// Standalone sync endpoint for Google Business Profile
// Add this route to server/routes.ts after the OAuth callback

// Manual sync endpoint
app.post("/api/google-business/sync/:accountId", async (req, res) => {
    try {
        const { accountId } = req.params;

        console.log(`[GMB Sync] Starting manual sync for account ${accountId}`);

        const account = await db.select().from(googleBusinessAccounts).where(eq(googleBusinessAccounts.id, accountId)).limit(1);

        if (!account.length || !account[0].accessToken) {
            return res.status(400).json({ error: "Account non connesso o non trovato" });
        }

        const accountData = account[0];

        // Set credentials
        const tempOAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL
        );

        tempOAuth2Client.setCredentials({
            access_token: accountData.accessToken || undefined,
            refresh_token: accountData.refreshToken || undefined,
            expiry_date: accountData.tokenExpiresAt ? parseInt(accountData.tokenExpiresAt) : undefined
        });

        // Initialize APIs
        const accountManagement = google.mybusinessaccountmanagement({ version: 'v1', auth: tempOAuth2Client });
        const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: tempOAuth2Client });
        const reviewsService = google.mybusinessreviews({ version: 'v1', auth: tempOAuth2Client });

        let googleAccountName = "";
        let googleLocationName = accountData.googleLocationId || "";

        // 1. If we don't have location ID stored, fetch it
        if (!googleLocationName) {
            const accountsRes = await accountManagement.accounts.list();
            const googleAccount = accountsRes.data.accounts?.[0];
            if (googleAccount) {
                googleAccountName = googleAccount.name || "";
                const locationsRes = await businessInfo.accounts.locations.list({
                    parent: googleAccountName,
                    readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
                });
                const locationData = locationsRes.data.locations?.[0];
                if (locationData) {
                    googleLocationName = locationData.name || "";
                }
            }
        }

        if (!googleLocationName) {
            return res.status(400).json({ error: "Nessuna location trovata per questo account" });
        }

        // 2. Fetch Location details
        const locationData = await businessInfo.accounts.locations.get({
            name: googleLocationName,
            readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
        });

        if (locationData.data) {
            const loc = locationData.data;
            const addressLines = loc.storefrontAddress?.addressLines || [];
            const city = loc.storefrontAddress?.locality || "";
            const postalCode = loc.storefrontAddress?.postalCode || "";
            const fullAddress = [...addressLines, city, postalCode].filter(Boolean).join(", ");

            await db.update(googleBusinessAccounts).set({
                nomeAttivita: loc.title || accountData.nomeAttivita,
                indirizzo: fullAddress || accountData.indirizzo,
                telefono: loc.phoneNumbers?.primaryPhone || accountData.telefono,
                sitoWeb: loc.websiteUri || accountData.sitoWeb,
                categoria: loc.categories?.primaryCategory?.displayName || accountData.categoria,
                googleLocationId: googleLocationName,
                lastSync: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }).where(eq(googleBusinessAccounts.id, accountId));
        }

        // 3. Fetch Reviews
        const reviewsRes = await reviewsService.accounts.locations.reviews.list({ parent: googleLocationName });
        const reviews = reviewsRes.data.reviews || [];

        if (reviews.length > 0) {
            await db.delete(googleBusinessReviews).where(eq(googleBusinessReviews.accountId, accountId));

            for (const review of reviews) {
                await db.insert(googleBusinessReviews).values({
                    id: crypto.randomUUID(),
                    accountId: accountId,
                    autore: review.reviewer?.displayName || "Utente Google",
                    rating: ["ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(review.starRating || "") + 1 || 5,
                    testo: review.comment || "",
                    dataRecensione: review.createTime || new Date().toISOString(),
                    risposta: review.reviewReply?.comment || null,
                    createdAt: new Date().toISOString()
                });
            }
            console.log(`[GMB Sync] Synced ${reviews.length} reviews for account ${accountId}`);
        }

        res.json({
            success: true,
            message: "Sincronizzazione completata",
            reviewsCount: reviews.length,
            lastSync: new Date().toISOString()
        });

    } catch (error: any) {
        console.error(`[GMB Sync] Error:`, error);
        res.status(500).json({ error: error.message || "Errore durante la sincronizzazione" });
    }
});

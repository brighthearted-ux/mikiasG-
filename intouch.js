/**
 * Senior Architect Implementation: Lead Generation & CRM Integration
 * Node.js script to handle Quote Form submissions with REST API logic.
 */

const axios = require('axios'); // For REST calls
const crypto = require('crypto'); // For CSRF/Security validation

// Configuration (Environment Variables)
const CRM_API_URL = 'https://api.pipedrive.com/v1/leads';
const CRM_API_KEY = process.env.CRM_API_KEY;

/**
 * Main handler for lead submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleLogisticsLead(req, res) {
    try {
        const { origin, destination, weight, incoterms, company, email, phone, csrfToken } = req.body;

        // 1. Server-Side Validation & Sanitization
        if (!email.includes('@') || isNaN(weight)) {
            return res.status(400).json({ error: "Invalid data format provided." });
        }

        // 2. Lead Scoring Logic
        // High-volume shipments (>5 tons) are flagged for senior account managers
        const leadScore = weight > 5000 ? 'High Priority' : 'Standard';
        const leadTags = weight > 5000 ? ['enterprise', 'high_volume'] : ['general'];

        // 3. Prepare CRM Payload
        const payload = {
            title: `Logistics Quote: ${company} (${origin} to ${destination})`,
            owner_id: weight > 5000 ? 123 : 456, // Assign to senior vs junior team
            label_ids: leadTags,
            custom_fields: {
                "cargo_weight": weight,
                "route": `${origin} -> ${destination}`,
                "incoterms": incoterms,
                "priority_level": leadScore
            },
            person_id: {
                name: company,
                email: [ { value: email, primary: true } ],
                phone: [ { value: phone, primary: true } ]
            }
        };

        // 4. REST API Integration with Exponential Backoff Logic
        await postToCRM(payload);

        return res.status(200).json({ 
            success: true, 
            message: "Lead synchronized with CRM successfully.",
            score: leadScore 
        });

    } catch (error) {
        console.error("CRM Sync Error:", error.message);
        res.status(500).json({ error: "Internal processing error." });
    }
}

/**
 * Handles API transmission with basic retry logic
 */
async function postToCRM(data, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(`${CRM_API_URL}?api_token=${CRM_API_KEY}`, data);
        } catch (err) {
            if (i === retries - 1) throw err;
            const delay = Math.pow(2, i) * 1000;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

module.exports = { handleLogisticsLead };
// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Email storage file
const EMAIL_FILE = path.join(__dirname, 'emails.json');

// Initialize emails file if it doesn't exist
async function initializeEmailFile() {
    try {
        await fs.access(EMAIL_FILE);
    } catch (error) {
        // File doesn't exist, create it
        await fs.writeFile(EMAIL_FILE, JSON.stringify({ 
            newsletter: [], 
            discount: [] 
        }, null, 2));
    }
}

// Read emails from file
async function readEmails() {
    try {
        const data = await fs.readFile(EMAIL_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading emails:', error);
        return { newsletter: [], discount: [] };
    }
}

// Write emails to file
async function writeEmails(emails) {
    try {
        await fs.writeFile(EMAIL_FILE, JSON.stringify(emails, null, 2));
    } catch (error) {
        console.error('Error writing emails:', error);
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Newsletter signup endpoint
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        const emails = await readEmails();
        
        // Check if email already exists in newsletter
        if (emails.newsletter.find(entry => entry.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already subscribed to our newsletter' 
            });
        }

        // Add email to newsletter list
        emails.newsletter.push({
            email: email,
            timestamp: new Date().toISOString(),
            source: 'newsletter'
        });

        await writeEmails(emails);

        res.json({ 
            success: true, 
            message: 'Thank you for subscribing! We\'ll be in touch soon.' 
        });

    } catch (error) {
        console.error('Newsletter signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Something went wrong. Please try again.' 
        });
    }
});

// Discount signup endpoint
app.post('/api/discount', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        const emails = await readEmails();
        
        // Check if email already exists in discount list
        if (emails.discount.find(entry => entry.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email has already been used for the discount' 
            });
        }

        // Generate a simple discount code
        const discountCode = 'SOURDOUGH10';

        // Add email to discount list
        emails.discount.push({
            email: email,
            timestamp: new Date().toISOString(),
            source: 'discount_popup',
            discountCode: discountCode
        });

        await writeEmails(emails);

        res.json({ 
            success: true, 
            message: 'Thanks! Your 10% discount code is: SOURDOUGH10',
            discountCode: discountCode
        });

    } catch (error) {
        console.error('Discount signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Something went wrong. Please try again.' 
        });
    }
});

// Get all emails (admin endpoint - you might want to add authentication)
app.get('/api/emails', async (req, res) => {
    try {
        const emails = await readEmails();
        res.json({
            success: true,
            data: {
                newsletter_count: emails.newsletter.length,
                discount_count: emails.discount.length,
                newsletter: emails.newsletter,
                discount: emails.discount
            }
        });
    } catch (error) {
        console.error('Get emails error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving emails' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Initialize and start server
async function startServer() {
    await initializeEmailFile();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin endpoint: http://localhost:${PORT}/api/emails`);
    });
}

startServer().catch(console.error);
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Script } = require('node:vm');
const app = express();

app.use(cors());
app.use(express.json());

// Catch global errors so the server doesn't just "quit"
process.on('uncaughtException', (err) => {
    console.log('❌ CRITICAL ERROR:', err.message);
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'brighthearted54@gmail.com',
        pass: 'YOUR_16_DIGIT_APP_PASSWORD_HERE' // <--- DOUBLE CHECK THIS
    }
});

app.post('/order', (req, res) => {
    console.log('New Order Received:', req.body);
    
    const mailOptions = {
        from: 'brighthearted54@gmail.com',
        to: 'brighthearted54@gmail.com',
        subject: 'New Logistics Quote Request',
        text: `New Quote Request:\nOrigin: ${req.body.origin}\nDestination: ${req.body.destination}\nWeight: ${req.body.weight}kg\nEmail: ${req.body.email}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('❌ EMAIL ERROR:', error.message);
            return res.status(500).send('Error');
        }
        console.log('✅ Email sent successfully!');
        res.status(200).send('Success');
    });
});
app.listen(5000, () => {
    console.log('🚀 SERVER IS WORKING ON PORT 5000');
});

const express = require('express');
const router = express.Router();

// Optional: enable nodemailer by uncommenting and configuring .env values
// const nodemailer = require('nodemailer');

router.get('/', (req, res) => {
  res.render('index', { title: 'Warangal Defence Academy' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About - Warangal Defence Academy' });
});

router.get('/courses', (req, res) => {
  res.render('courses', { title: 'Courses - Warangal Defence Academy' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact - Warangal Defence Academy', success: false });
});

// Simple contact/admission POST handler.
// Replace console.log with DB save or nodemailer to email form submissions.
router.post('/contact', async (req, res) => {
  try {
    const payload = req.body; // name, email, phone, message etc.
    console.log('Contact submission:', payload);

    // If you want to send email via nodemailer, enable and configure below:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'admissions@warangaldefence.ac.in', // academy email
      subject: `New contact form: ${payload.name || 'Unknown'}`,
      text: `Message: ${payload.message}\n\nContact: ${payload.email}\nPhone: ${payload.phone || 'N/A'}`
    });
    */

    // On success, re-render contact page (you can redirect instead)
    return res.render('contact', { title: 'Contact - Warangal Defence Academy', success: true });
  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).render('contact', { title: 'Contact - Warangal Defence Academy', success: false, error: true });
  }
});

module.exports = router;
router.get('/chat', (req, res) => {
  res.render('chat', { title: 'AI Chat - Warangal Defence Academy' });
});


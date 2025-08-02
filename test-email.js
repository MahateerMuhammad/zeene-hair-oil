// Simple test script to verify email functionality
// Run with: node test-email.js
const { Resend } = require('resend');

const resend = new Resend('re_ZZEC9iu7_LDuQgZyoDJfFeQUKbDf6S656');

async function testEmail() {
  try {
    console.log('Testing email...');
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zeene.contact@gmail.com',
      subject: 'Test Email from ZEENE',
      html: '<p>This is a test email to verify the email system is working!</p>'
    });

    if (error) {
      console.error('Email error:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEmail();
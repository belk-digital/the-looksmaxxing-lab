export function getWelcomeEmailHtml(discountCode: string = 'Welcome15') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Longevia Research</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; display: block; }
    body { margin: 0; padding: 0; background-color: #f4f4f5; color: #18181b; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    .hero-img { width: 100%; height: 260px; object-fit: cover; display: block; }
    .header { padding: 40px 20px 20px 20px; text-align: center; }
    .logo { font-family: Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: -1.5px; color: #000000; text-decoration: none; }
    .content-block { padding: 10px 48px 48px 48px; text-align: center; }
    .eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #71717a; margin-bottom: 16px; font-weight: 500; }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-transform: uppercase; margin: 0 0 16px 0; color: #09090b; line-height: 1.2; }
    p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; font-weight: 400; }
    .discount-box { margin: 24px auto; padding: 24px; background-color: #fafafa; border: 1px dashed #d4d4d8; border-radius: 8px; display: inline-block; min-width: 220px; }
    .discount-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 8px; font-weight: 500; }
    .discount-code { font-size: 26px; font-weight: 700; color: #09090b; letter-spacing: 2px; }
    .btn { display: inline-block; background-color: #09090b; color: #ffffff !important; padding: 16px 48px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 12px; transition: background-color 0.2s; }
    .btn:hover { background-color: #27272a; }
    .footer { padding: 32px 48px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
    .disclaimer { font-size: 11px; line-height: 1.6; color: #a1a1aa; font-weight: 400; }
  </style>
</head>
<body>
  <center style="width: 100%; background-color: #f4f4f5; padding: 40px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container">
      <tr>
        <td>
          <img src="https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/longevia-hero-landscape.webp" alt="Longevia Research" class="hero-img" width="600" height="260">
        </td>
      </tr>
      <tr>
        <td class="header">
          <a href="https://longeviaresearch.com" class="logo">Longevia</a>
        </td>
      </tr>
      <tr>
        <td class="content-block">
          <div class="eyebrow">Community Member</div>
          <h1>Welcome to the Lab</h1>
          <p>
            Thank you for joining the foremost network of longevity research. As a member of our community, you now have priority access to our highest-grade compounds, latest clinical insights, and exclusive research batches.
          </p>
          <p>
            To welcome you, please use the code below for 15% off your first synthesis order.
          </p>
          
          <div class="discount-box">
            <div class="discount-label">Your Discount Code</div>
            <div class="discount-code">${discountCode}</div>
          </div>
          <br>
          <a href="https://longeviaresearch.com/shop" class="btn">Enter The Lab</a>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="disclaimer">
            <strong>FDA Disclaimer:</strong> These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease. All products offered are for laboratory and research use only. They are not intended for human consumption.<br><br>
            © ${new Date().getFullYear()} Longevia Research. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

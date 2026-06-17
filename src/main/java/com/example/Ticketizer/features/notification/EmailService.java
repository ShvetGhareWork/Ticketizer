package com.example.Ticketizer.features.notification;

import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.Ticketizer.features.booking.TicketNotificationEvent;
import java.util.Base64;

@Service
public class EmailService {
    
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTicketConfrimationEmail(TicketNotificationEvent event) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String rawTitle = event.showTitle() != null ? event.showTitle() : "";
            String cleanedTitle = rawTitle.split(":::imageURL:::")[0];
            String bannerImageUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80"; // fallback
            if (rawTitle.contains(":::imageURL:::")) {
                String[] parts = rawTitle.split(":::imageURL:::");
                if (parts.length > 1 && parts[1] != null && !parts[1].trim().isEmpty()) {
                    bannerImageUrl = parts[1].trim();
                }
            }

            helper.setTo(event.recipientEmail());
            helper.setSubject("Your Ticket Confirmation for " + cleanedTitle);

            String[] seats = event.seatNumber().split(",\\s*");
            String[] qrCodes = event.qrCodeBase64() != null ? event.qrCodeBase64().split("\\|") : new String[0];

            // Build dynamic seat details HTML list
            StringBuilder seatsHtml = new StringBuilder();
            for (String seat : seats) {
                seatsHtml.append("<span style='display: inline-block; padding: 4px 8px; margin: 2px; background-color: #E2ECFF; color: #0d6efd; border-radius: 4px; font-weight: 800; font-size: 13px;'>")
                         .append(seat)
                         .append("</span> ");
            }

            // Build dynamic QR codes HTML layout
            StringBuilder qrHtml = new StringBuilder();
            for (int i = 0; i < qrCodes.length; i++) {
                String seatLabel = i < seats.length ? seats[i] : "";
                qrHtml.append(
                    "            <div class='qr-card-container' style='display: inline-block; margin: 10px; padding: 12px; background-color: #ffffff; border: 2px solid #E2E8F0; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); text-align: center;'>" +
                    "              <p style='margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #0d6efd;'>SEAT " + seatLabel + "</p>" +
                    "              <img src=\"cid:qrCode_" + i + "\" alt=\"Ticket QR Code\" style=\"width: 140px; height: 140px; display: block; margin: 0 auto;\" />" +
                    "            </div>"
                );
            }

            // Build rich HTML email structure
            String htmlBody = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='utf-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>Your Ticket Confirmation</title>" +
                "  <style>" +
                "    @media only screen and (max-width: 600px) {" +
                "      .email-container {" +
                "        width: 100%% !important;" +
                "        max-width: 100%% !important;" +
                "        border-radius: 0 !important;" +
                "      }" +
                "      .mobile-padding {" +
                "        padding: 20px 16px !important;" +
                "      }" +
                "      .mobile-col {" +
                "        display: block !important;" +
                "        width: 100%% !important;" +
                "        box-sizing: border-box !important;" +
                "      }" +
                "      .mobile-margin-bottom {" +
                "        margin-bottom: 15px !important;" +
                "      }" +
                "      .mobile-align-right {" +
                "        text-align: left !important;" +
                "        margin-top: 10px !important;" +
                "      }" +
                "      .qr-card-container {" +
                "        display: block !important;" +
                "        margin: 10px auto !important;" +
                "        max-width: 180px !important;" +
                "      }" +
                "    }" +
                "  </style>" +
                "</head>" +
                "<body style='margin: 0; padding: 0; background-color: #F4F6F9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;'>" +
                "  <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%%' style='background-color: #F4F6F9; padding: 20px 0;'>" +
                "    <tr>" +
                "      <td align='center' valign='top'>" +
                "        <div class='email-container' style='width: 100%%; max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
                "          " +
                "          <!-- HEADER BANNER IMAGE -->" +
                "          <div style='width: 100%%; height: 180px; background: linear-gradient(135deg, #0d6efd 0%%, #002D62 100%%); position: relative; overflow: hidden;'>" +
                "            <img src='%s' alt='Event Banner' style='width: 100%%; height: 100%%; object-fit: cover; opacity: 0.85;' />" +
                "          </div>" +
                "          " +
                "          <!-- BRAND HEADER -->" +
                "          <div class='mobile-padding' style='padding: 24px 32px 0 32px; text-align: left;'>" +
                "            <table width='100%%' border='0' cellspacing='0' cellpadding='0'>" +
                "              <tr>" +
                "                <td class='mobile-col'>" +
                "                  <span style='display: inline-block; padding: 6px 12px; background-color: #E2ECFF; color: #0d6efd; font-size: 11px; font-weight: 850; letter-spacing: 1.5px; border-radius: 50px; text-transform: uppercase;'>Order Confirmed</span>" +
                "                </td>" +
                "                <td class='mobile-col mobile-align-right' style='text-align: right; font-weight: 800; font-size: 18px; color: #002D62; letter-spacing: -0.5px;'>" +
                "                  <span style='color: #0d6efd;'>●</span> Ticketizer" +
                "                </td>" +
                "              </tr>" +
                "            </table>" +
                "            <h1 style='margin: 20px 0 8px 0; font-size: 28px; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: -0.5px;'>Ticket Confirmed!</h1>" +
                "            <p style='margin: 0; font-size: 15px; color: #64748B;'>Hello <strong>%s</strong>, your order has been processed and your seats are secured.</p>" +
                "          </div>" +
                "          " +
                "          <!-- TICKET STUB CONTENT -->" +
                "          <div class='mobile-padding' style='margin: 24px 32px; padding: 24px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;'>" +
                "            <p style='margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;'>Event Title</p>" +
                "            <h2 style='margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0F172A; text-transform: uppercase; line-height: 1.2;'>%s</h2>" +
                "            " +
                "            <table width='100%%' border='0' cellspacing='0' cellpadding='0' style='border-top: 1px solid #E2E8F0; padding-top: 16px;'>" +
                "              <tr>" +
                "                <td class='mobile-col mobile-margin-bottom' width='50%%' style='vertical-align: top;'>" +
                "                  <p style='margin: 0 0 2px 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;'>Booking Reference</p>" +
                "                  <p style='margin: 0; font-size: 13px; font-weight: 700; color: #334155; font-family: monospace;'>#%s</p>" +
                "                </td>" +
                "                <td class='mobile-col mobile-margin-bottom' width='50%%' style='vertical-align: top;'>" +
                "                  <p style='margin: 0 0 2px 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;'>Show Time</p>" +
                "                  <p style='margin: 0; font-size: 13px; font-weight: 700; color: #334155;'>%s</p>" +
                "                </td>" +
                "              </tr>" +
                "              <tr>" +
                "                <td class='mobile-col mobile-margin-bottom' width='50%%' style='vertical-align: top;'>" +
                "                  <p style='margin: 0 0 2px 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;'>Seats Allocated</p>" +
                "                  <p style='margin: 0; font-size: 15px; font-weight: 800; color: #0d6efd;'>%s</p>" +
                "                </td>" +
                "                <td class='mobile-col' width='50%%' style='vertical-align: top;'>" +
                "                  <p style='margin: 0 0 2px 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;'>Admission Type</p>" +
                "                  <p style='margin: 0; font-size: 13px; font-weight: 700; color: #334155;'>Standard Entry</p>" +
                "                </td>" +
                "              </tr>" +
                "            </table>" +
                "          </div>" +
                "          " +
                "          <!-- PERFORATION LINE -->" +
                "          <div style='height: 1px; border-top: 2px dashed #E2E8F0; margin: 0 16px; position: relative;'>" +
                "            <div style='position: absolute; left: -24px; top: -10px; width: 20px; height: 20px; background-color: #F4F6F9; border-radius: 50%%;'></div>" +
                "            <div style='position: absolute; right: -24px; top: -10px; width: 20px; height: 20px; background-color: #F4F6F9; border-radius: 50%%;'></div>" +
                "          </div>" +
                "          " +
                "          <!-- QR CARD -->" +
                "          <div class='mobile-padding' style='padding: 32px; text-align: center; background-color: #FCFDFE;'>" +
                "            <p style='margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #334155;'>Scan these digital tokens at the entrance gate:</p>" +
                "            %s" +
                "            <p style='margin: 12px 0 0 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;'>Authorized Entry Code</p>" +
                "          </div>" +
                "          " +
                "          <!-- ENTRY DETAILS CHECKLIST -->" +
                "          <div class='mobile-padding' style='padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;'>" +
                "            <h4 style='margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;'>Important Instructions</h4>" +
                "            <ul style='margin: 0; padding: 0 0 0 16px; font-size: 13px; color: #64748B; line-height: 1.6; font-weight: 500;'>" +
                "              <li style='margin-bottom: 6px;'>Please arrive <strong>60-90 minutes</strong> before showtime.</li>" +
                "              <li style='margin-bottom: 6px;'>Bring a valid government-issued photo ID matching your user profile.</li>" +
                "              <li style='margin-bottom: 0;'>Keep this digital ticket ready on your phone screen for gate scanners.</li>" +
                "            </ul>" +
                "          </div>" +
                "          " +
                "          <!-- FOOTER -->" +
                "          <div style='padding: 24px; text-align: center; background-color: #002D62; color: #ffffff; font-size: 12px; font-weight: 500;'>" +
                "            <p style='margin: 0 0 8px 0; font-weight: 700; letter-spacing: 0.5px; opacity: 0.9;'>Need assistance? Contact <a href='mailto:support@ticketizer.com' style='color: #0d6efd; text-decoration: none; font-weight: 800;'>support@ticketizer.com</a></p>" +
                "            <p style='margin: 0; opacity: 0.6;'>© 2026 Ticketizer. All rights reserved. Seats don't wait.</p>" +
                "          </div>" +
                "          " +
                "        </div>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>",
                bannerImageUrl,
                event.userName(),
                cleanedTitle,
                event.bookingId(),
                event.StartTime(),
                seatsHtml.toString(),
                qrHtml.toString()
            );

            helper.setText(htmlBody, true);

            // Add Gmail-compliant inline CID resource mapping
            if (event.qrCodeBase64() != null) {
                for (int i = 0; i < qrCodes.length; i++) {
                    if (qrCodes[i] == null || qrCodes[i].trim().isEmpty()) {
                        continue;
                    }
                    String cleanBase64 = qrCodes[i].trim();
                    int commaIdx = cleanBase64.indexOf(",");
                    if (commaIdx != -1) {
                        cleanBase64 = cleanBase64.substring(commaIdx + 1);
                    }
                    cleanBase64 = cleanBase64.replaceAll("[^A-Za-z0-9+/=]", "");
                    if (cleanBase64.isEmpty()) {
                        continue;
                    }
                    byte[] qrBytes;
                    try {
                        qrBytes = Base64.getMimeDecoder().decode(cleanBase64);
                    } catch (Exception e) {
                        System.err.println("Skipping malformed/invalid QR code base64 segment: " + e.getMessage());
                        continue;
                    }
                    
                    final int idx = i;
                    ByteArrayResource qrResource = new ByteArrayResource(qrBytes) {
                        @Override
                        public String getFilename() {
                            return "qrcode_" + idx + ".png";
                        }
                    };
                    
                    helper.addInline("qrCode_" + i, qrResource, "image/png");
                }
            }

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send ticket confirmation email", e);
        }
    }

    public void sendOtpEmail(String recipientEmail, String otp) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setTo(recipientEmail);
                helper.setSubject("Verify Your Ticketizer Account");
                
                String htmlBody = String.format(
                    "<html><body style='font-family: Arial, sans-serif; text-align: center; padding: 40px;'>" +
                    "  <h2>Welcome to Ticketizer!</h2>" +
                    "  <p>Use the secure OTP code below to verify your account and unlock seat bookings:</p>" +
                    "  <h1 style='color: #0d6efd; letter-spacing: 4px; font-size: 36px; margin: 20px 0;'>%s</h1>" +
                    "  <p style='color: #94A3B8; font-size: 12px;'>This code will expire in 10 minutes.</p>" +
                    "</body></html>", otp
                );
                
                helper.setText(htmlBody, true);
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    public void sendTicketCancellationEmail(
            String recipientEmail,
            String userName,
            String eventTitle,
            String seatNumber,
            String bookingRef,
            Double price,
            String imageUrl,
            String startTime) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                String cleanedTitle = eventTitle.split(":::imageURL:::")[0];
                String shortRef = bookingRef != null ? (bookingRef.length() > 8 ? bookingRef.substring(0, 8) : bookingRef) : "TEMP";
                String bannerImageUrl = (imageUrl != null && !imageUrl.trim().isEmpty()) ? imageUrl.trim() : "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80";

                String formattedTime = startTime;
                try {
                    java.time.Instant instant = java.time.Instant.parse(startTime);
                    java.time.LocalDateTime ldt = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.of("UTC"));
                    formattedTime = ldt.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd • HH:mm:ss"));
                } catch (Exception e) {
                    // fallback to raw string
                }

                helper.setTo(recipientEmail);
                helper.setSubject("Ticket Cancellation Confirmed: " + cleanedTitle);

                String htmlBody = String.format(
                    "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "  <meta charset='utf-8'>" +
                    "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "  <title>Ticket Cancellation Confirmed</title>" +
                    "  <style>" +
                    "    body {" +
                    "      margin: 0;" +
                    "      padding: 0;" +
                    "      background-color: #F4F6F9;" +
                    "      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;" +
                    "    }" +
                    "    table {" +
                    "      border-collapse: collapse;" +
                    "      width: 100%%;" +
                    "    }" +
                    "    .email-container {" +
                    "      max-width: 600px;" +
                    "      margin: 20px auto;" +
                    "      background-color: #ffffff;" +
                    "      border: 1px solid #E2E8F0;" +
                    "      border-radius: 16px;" +
                    "      overflow: hidden;" +
                    "      box-shadow: 0 4px 15px rgba(0,0,0,0.03);" +
                    "    }" +
                    "    .header-bar {" +
                    "      padding: 20px 32px;" +
                    "      border-bottom: 1px solid #F1F5F9;" +
                    "    }" +
                    "    .logo {" +
                    "      font-size: 18px;" +
                    "      font-weight: 800;" +
                    "      color: #002D62;" +
                    "      letter-spacing: -0.5px;" +
                    "      text-decoration: none;" +
                    "    }" +
                    "    .logo-dot {" +
                    "      color: #0d6efd;" +
                    "    }" +
                    "    .order-ref {" +
                    "      font-size: 13px;" +
                    "      color: #64748B;" +
                    "      font-weight: 500;" +
                    "      text-align: right;" +
                    "    }" +
                    "    .banner {" +
                    "      background-color: #FFF0F0;" +
                    "      padding: 32px 24px;" +
                    "      text-align: center;" +
                    "      border-bottom: 1px solid #FFE4E4;" +
                    "    }" +
                    "    .circle-icon {" +
                    "      width: 48px;" +
                    "      height: 48px;" +
                    "      background-color: #EF4444;" +
                    "      border-radius: 50%%;" +
                    "      display: inline-flex;" +
                    "      align-items: center;" +
                    "      justify-content: center;" +
                    "      margin-bottom: 16px;" +
                    "    }" +
                    "    .banner-title {" +
                    "      font-size: 24px;" +
                    "      font-weight: 800;" +
                    "      color: #991B1B;" +
                    "      margin: 0 0 10px 0;" +
                    "    }" +
                    "    .banner-desc {" +
                    "      font-size: 14px;" +
                    "      color: #7F1D1D;" +
                    "      line-height: 1.5;" +
                    "      max-width: 440px;" +
                    "      margin: 0 auto;" +
                    "    }" +
                    "    .content-body {" +
                    "      padding: 32px;" +
                    "    }" +
                    "    .event-card {" +
                    "      border: 1px solid #E2E8F0;" +
                    "      border-radius: 12px;" +
                    "      overflow: hidden;" +
                    "      margin-bottom: 24px;" +
                    "    }" +
                    "    .event-img {" +
                    "      width: 100%%;" +
                    "      height: 160px;" +
                    "      object-fit: cover;" +
                    "      display: block;" +
                    "    }" +
                    "    .event-details {" +
                    "      padding: 20px;" +
                    "    }" +
                    "    .cancelled-badge {" +
                    "      display: inline-block;" +
                    "      padding: 4px 8px;" +
                    "      background-color: #0D6EFD;" +
                    "      color: #ffffff;" +
                    "      font-size: 10px;" +
                    "      font-weight: 800;" +
                    "      letter-spacing: 1px;" +
                    "      text-transform: uppercase;" +
                    "      border-radius: 4px;" +
                    "      margin-bottom: 12px;" +
                    "    }" +
                    "    .event-title {" +
                    "      font-size: 18px;" +
                    "      font-weight: 800;" +
                    "      color: #0F172A;" +
                    "      margin: 0 0 8px 0;" +
                    "    }" +
                    "    .event-time {" +
                    "      font-size: 13px;" +
                    "      color: #475569;" +
                    "      font-weight: 600;" +
                    "      margin: 0 0 16px 0;" +
                    "    }" +
                    "    .ref-label {" +
                    "      font-size: 10px;" +
                    "      font-weight: 700;" +
                    "      color: #94A3B8;" +
                    "      text-transform: uppercase;" +
                    "      letter-spacing: 0.5px;" +
                    "      margin-bottom: 4px;" +
                    "    }" +
                    "    .ref-val {" +
                    "      font-size: 13px;" +
                    "      font-weight: 700;" +
                    "      color: #3b82f6;" +
                    "      font-family: monospace;" +
                    "    }" +
                    "    .refund-card {" +
                    "      background-color: #F8FAFC;" +
                    "      border: 1px solid #E2E8F0;" +
                    "      border-radius: 12px;" +
                    "      padding: 20px;" +
                    "      margin-bottom: 24px;" +
                    "    }" +
                    "    .refund-title {" +
                    "      font-size: 16px;" +
                    "      font-weight: 800;" +
                    "      color: #0F172A;" +
                    "      margin: 0 0 16px 0;" +
                    "    }" +
                    "    .refund-row {" +
                    "      margin-bottom: 12px;" +
                    "    }" +
                    "    .refund-row-last {" +
                    "      margin-bottom: 0;" +
                    "    }" +
                    "    .refund-label {" +
                    "      font-size: 13px;" +
                    "      color: #64748B;" +
                    "      font-weight: 550;" +
                    "    }" +
                    "    .refund-value {" +
                    "      font-size: 13px;" +
                    "      color: #0F172A;" +
                    "      font-weight: 700;" +
                    "      text-align: right;" +
                    "    }" +
                    "    .refund-amount {" +
                    "      font-size: 18px;" +
                    "      color: #0D6EFD;" +
                    "      font-weight: 800;" +
                    "      text-align: right;" +
                    "    }" +
                    "    .warning-panel {" +
                    "      border-left: 3px solid #EF4444;" +
                    "      background-color: #FFF5F5;" +
                    "      padding: 16px;" +
                    "      border-radius: 0 8px 8px 0;" +
                    "      margin-bottom: 32px;" +
                    "    }" +
                    "    .warning-text {" +
                    "      font-size: 13px;" +
                    "      color: #7F1D1D;" +
                    "      font-weight: 500;" +
                    "      line-height: 1.5;" +
                    "    }" +
                    "    .warning-bold {" +
                    "      color: #EF4444;" +
                    "      font-weight: 700;" +
                    "    }" +
                    "    .button-container {" +
                    "      text-align: center;" +
                    "      margin-bottom: 32px;" +
                    "    }" +
                    "    .btn {" +
                    "      display: inline-block;" +
                    "      background-color: #0D6EFD;" +
                    "      color: #ffffff;" +
                    "      padding: 12px 24px;" +
                    "      font-size: 13px;" +
                    "      font-weight: 700;" +
                    "      text-decoration: none;" +
                    "      border-radius: 8px;" +
                    "      box-shadow: 0 4px 6px rgba(13,110,253,0.15);" +
                    "    }" +
                    "    .footer {" +
                    "      background-color: #F8FAFC;" +
                    "      border-top: 1px solid #E2E8F0;" +
                    "      padding: 32px 24px;" +
                    "      text-align: center;" +
                    "    }" +
                    "    .footer-title {" +
                    "      font-size: 16px;" +
                    "      font-weight: 800;" +
                    "      color: #0F172A;" +
                    "      margin: 0 0 12px 0;" +
                    "    }" +
                    "    .footer-link {" +
                    "      font-size: 13px;" +
                    "      color: #0D6EFD;" +
                    "      text-decoration: none;" +
                    "      font-weight: 700;" +
                    "    }" +
                    "    .footer-sublinks {" +
                    "      margin-top: 8px;" +
                    "      font-size: 12px;" +
                    "      color: #64748B;" +
                    "      font-weight: 500;" +
                    "    }" +
                    "    .footer-sublinks a {" +
                    "      color: #64748B;" +
                    "      text-decoration: none;" +
                    "      margin: 0 8px;" +
                    "    }" +
                    "    .copyright {" +
                    "      margin-top: 16px;" +
                    "      font-size: 11px;" +
                    "      color: #94A3B8;" +
                    "      font-weight: 500;" +
                    "    }" +
                    "  </style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='email-container'>" +
                    "    <div class='header-bar'>" +
                    "      <table width='100%%'>" +
                    "        <tr>" +
                    "          <td>" +
                    "            <span class='logo'><span class='logo-dot'>●</span> Ticketizer</span>" +
                    "          </td>" +
                    "          <td class='order-ref'>" +
                    "            Order #%s" +
                    "          </td>" +
                    "        </tr>" +
                    "      </table>" +
                    "    </div>" +
                    "    " +
                    "    <div class='banner'>" +
                    "      <div class='circle-icon'>" +
                    "        <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>" +
                    "          <polyline points='20 6 9 17 4 12'></polyline>" +
                    "        </svg>" +
                    "      </div>" +
                    "      <h1 class='banner-title'>Order Cancelled</h1>" +
                    "      <p class='banner-desc'>Hello %s, your cancellation request has been processed. We've released your seats and initiated your refund.</p>" +
                    "    </div>" +
                    "    " +
                    "    <div class='content-body'>" +
                    "      <div class='event-card'>" +
                    "        <img src='%s' alt='Event Image' class='event-img'>" +
                    "        <div class='event-details'>" +
                    "          <span class='cancelled-badge'>Cancelled</span>" +
                    "          <h2 class='event-title'>%s</h2>" +
                    "          <p class='event-time'>%s</p>" +
                    "          <div class='ref-label'>Booking Ref</div>" +
                    "          <div class='ref-val'>#%s</div>" +
                    "          <div class='ref-label' style='margin-top: 10px;'>Seat(s)</div>" +
                    "          <div style='font-size: 13px; font-weight: 700; color: #0F172A;'>%s</div>" +
                    "        </div>" +
                    "      </div>" +
                    "      " +
                    "      <div class='refund-card'>" +
                    "        <h3 class='refund-title'>Refund Summary</h3>" +
                    "        <table width='100%%'>" +
                    "          <tr class='refund-row'>" +
                    "            <td class='refund-label'>Refund Amount</td>" +
                    "            <td class='refund-amount'>$%s</td>" +
                    "          </tr>" +
                    "          <tr class='refund-row'>" +
                    "            <td class='refund-label' style='padding-top: 12px;'>Refund Method</td>" +
                    "            <td class='refund-value' style='padding-top: 12px;'>" +
                    "              Original Payment Method<br>" +
                    "              <span style='font-size: 11px; color: #94A3B8; font-weight: 500;'>Visa ending in 4242</span>" +
                    "            </td>" +
                    "          </tr>" +
                    "          <tr class='refund-row-last'>" +
                    "            <td class='refund-label' style='padding-top: 12px;'>Estimated Timeline</td>" +
                    "            <td class='refund-value' style='padding-top: 12px;'>5-7 business days</td>" +
                    "          </tr>" +
                    "        </table>" +
                    "      </div>" +
                    "      " +
                    "      <div class='warning-panel'>" +
                    "        <table width='100%%'>" +
                    "          <tr>" +
                    "            <td width='24' style='vertical-align: top; padding-right: 8px;'>" +
                    "              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#EF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
                    "                <circle cx='12' cy='12' r='10'></circle>" +
                    "                <line x1='12' y1='16' x2='12' y2='12'></line>" +
                    "                <line x1='12' y1='8' x2='12.01' y2='8'></line>" +
                    "              </svg>" +
                    "            </td>" +
                    "            <td>" +
                    "              <p class='warning-text' style='margin: 0;'>No further action is required. This ticket is now <span class='warning-bold'>VOID</span> and cannot be used for entry.</p>" +
                    "            </td>" +
                    "          </tr>" +
                    "        </table>" +
                    "      </div>" +
                    "      " +
                    "      <div class='button-container'>" +
                    "        <a href='https://ticketizer.com/help' class='btn' style='color: #ffffff; text-decoration: none;'>" +
                    "          <span style='display: inline-block; vertical-align: middle; margin-right: 6px; margin-top: -2px;'>" +
                    "            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>" +
                    "              <circle cx='12' cy='12' r='10'></circle>" +
                    "              <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path>" +
                    "              <line x1='12' y1='17' x2='12.01' y2='17'></line>" +
                    "            </svg>" +
                    "          </span>" +
                    "          Visit Help Center" +
                    "        </a>" +
                    "      </div>" +
                    "    </div>" +
                    "    " +
                    "    <div class='footer'>" +
                    "      <h4 class='footer-title'>Ticketizer</h4>" +
                    "      <p style='margin: 0 0 8px 0; font-size: 12px; color: #64748B; font-weight: 500;'>" +
                    "        Need assistance? <a href='mailto:support@ticketizer.com' class='footer-link'>Contact support@ticketizer.com</a>" +
                    "      </p>" +
                    "      <div class='footer-sublinks'>" +
                    "        <a href='https://ticketizer.com/privacy'>Privacy Policy</a>" +
                    "        <a href='https://ticketizer.com/terms'>Terms of Service</a>" +
                    "        <a href='https://ticketizer.com/cookie-settings'>Cookie Settings</a>" +
                    "      </div>" +
                    "      <p class='copyright'>© 2026 Ticketizer Inc. All rights reserved.</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>",
                    shortRef,
                    userName,
                    bannerImageUrl,
                    cleanedTitle,
                    formattedTime,
                    bookingRef,
                    seatNumber,
                    String.format("%.2f", price)
                );

                helper.setText(htmlBody, true);
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}

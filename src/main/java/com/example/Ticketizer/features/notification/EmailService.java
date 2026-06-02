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
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }
}

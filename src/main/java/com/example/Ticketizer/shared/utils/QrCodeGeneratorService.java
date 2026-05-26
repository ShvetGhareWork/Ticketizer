package com.example.Ticketizer.shared.utils;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class QrCodeGeneratorService {

    public String generateQrCodeBase64(String manifestText) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            // Encodes textual data into a standard QR code matrix configuration
            BitMatrix bitMatrix = qrCodeWriter.encode(manifestText, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngDataBytes = pngOutputStream.toByteArray();

            // Return a format ready for direct browser rendering strings
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngDataBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate cryptographic entry QR token matrix", e);
        }
    }
}
package com.example.Ticketizer.features.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Service
@Slf4j
public class PaymentOrderService {

    private RazorpayClient razorpayClient;

    @Value("${razorpay.key.id:rzp_test_mockkeyid123}")
    private String keyId;

    @Value("${razorpay.key.secret:mocksecretkeyid123456}")
    private String keySecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.booking-service:http://localhost:8083}")
    private String bookingServiceUrl;

    @PostConstruct
    public void init() throws RazorpayException {
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
    }

    public Map<String, String> createRazorpayOrder(String bookingReference) throws RazorpayException {
        String[] references = bookingReference.split(",");
        double totalPrice = 0;
        
        for (String ref : references) {
            try {
                Map<?, ?> bookingMap = restTemplate.getForObject(bookingServiceUrl + "/api/v1/bookings/" + ref, Map.class);
                if (bookingMap != null && bookingMap.containsKey("price")) {
                    Number price = (Number) bookingMap.get("price");
                    totalPrice += price.doubleValue();
                } else {
                    totalPrice += 150.0; // Fallback price
                }
            } catch (Exception ex) {
                log.error("Failed to query booking price for ref: {}", ref, ex);
                totalPrice += 150.0;
            }
        }

        int amountInPaise = (int) (totalPrice * 100);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", references[0]);
        orderRequest.put("payment_capture", 1);

        log.info("Creating Razorpay order for ref list: {} with total price: {}", bookingReference, totalPrice);
        Order order = razorpayClient.orders.create(orderRequest);

        return Map.of(
                "orderId", order.get("id"),
                "amount", String.valueOf(amountInPaise),
                "currency", "INR",
                "keyId", keyId
        );
    }
}

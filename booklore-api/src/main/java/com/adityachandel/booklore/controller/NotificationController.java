package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class NotificationController {

    /*@MessageMapping("/send")
    @SendTo("/topic/messages")
    public String sendMessage(String message) {
        System.out.println("Received message: " + message);
        return "Hello";
    }*/

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @MessageMapping("/send")
    public void handleIncomingMessage(Object message) {
        System.out.println("Received message: " + message);
    }

    public void sendMessageToTopic(String topic, Object message) {
        notificationService.sendMessage(topic, message);
    }
}

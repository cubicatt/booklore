package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.websocket.Topic;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendMessage(Topic topic, Object message) {
        messagingTemplate.convertAndSend(String.valueOf(topic), message);
    }
}

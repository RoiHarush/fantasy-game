"use client";

import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs/lib/stomp";
import API_URL from "../config";
import { useAuth } from "./AuthContext";
import { WebSocketContext } from "./WebSocketContext";

export function WebSocketProvider({ children }) {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);
    const subscriptionsRef = useRef({});

    useEffect(() => {
        if (!user) {
            setConnected(false);
            return;
        }
        const socket = new SockJS(`${API_URL}/ws`);
        const stomp = over(socket);

        stomp.debug = () => { };

        const token = localStorage.getItem("token");
        stomp.connect({ Authorization: `Bearer ${token}` }, () => {
            stompClientRef.current = stomp;
            setConnected(true);
        });

        return () => {
            Object.values(subscriptionsRef.current).forEach(subscription => subscription.unsubscribe());
            subscriptionsRef.current = {};
            setConnected(false);
            stompClientRef.current = null;
            if (stomp.connected) {
                stomp.disconnect(() => { });
            }
        };
    }, [user]);

    const subscribe = (topic, callback) => {
        if (!stompClientRef.current || !connected) return;
        if (subscriptionsRef.current[topic]) return;

        const subscription = stompClientRef.current.subscribe(topic, (message) => {
            const body = JSON.parse(message.body);
            callback(body);
        });

        subscriptionsRef.current[topic] = subscription;
    };

    const unsubscribe = (topic) => {
        const sub = subscriptionsRef.current[topic];
        if (sub) {
            sub.unsubscribe();
            delete subscriptionsRef.current[topic];
        }
    };

    const sendMessage = (destination, body) => {
        if (!stompClientRef.current || !connected) return;
        stompClientRef.current.send(destination, {}, JSON.stringify(body));
    };

    return (
        <WebSocketContext.Provider value={{ connected, subscribe, unsubscribe, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

import { createContext, useContext, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import API_URL from "../config";

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);
    const subscriptionsRef = useRef({});

    useEffect(() => {
        const socket = new SockJS(`${API_URL}/ws`);
        const stomp = over(socket);

        stomp.connect({}, () => {
            stompClientRef.current = stomp;
            setConnected(true);
        });

        return () => {
            if (stomp.connected) {
                stomp.disconnect(() => console.log("❌ Disconnected"));
            }
        };
    }, []);

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

export function useWebSocket() {
    return useContext(WebSocketContext);
}


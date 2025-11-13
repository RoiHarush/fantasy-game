import { useEffect, useState } from "react";

function TestFetch() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://localhost:8080/hello")
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch((err) => console.error("Error fetching:", err));
    }, []);

    return (
        <div>
            <h1>Message from server:</h1>
            <p>{message}</p>
        </div>
    );
}

export default TestFetch;

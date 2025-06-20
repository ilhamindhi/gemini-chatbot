document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // Function to append messages to the chat box
    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message'); // Base class for all messages

        // Add sender-specific class for styling
        if (sender === 'User') {
            messageElement.classList.add('user-message');
        } else if (sender === 'Gemini') {
            messageElement.classList.add('ai-message');
        } else if (sender === 'Error') {
            messageElement.classList.add('error-message'); // Specific class for error messages
        }

        // Using textContent to help prevent XSS vulnerabilities
        const senderElement = document.createElement('strong');
        senderElement.textContent = `${sender}: `;
        messageElement.appendChild(senderElement);

        const textElement = document.createElement('span');
        textElement.textContent = text;
        messageElement.appendChild(textElement);

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
    }

    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission which reloads the page

        const userMessageText = userInput.value.trim();
        if (!userMessageText) {
            return; // Don't send empty messages
        }

        // Display user's message immediately
        appendMessage('User', userMessageText);
        userInput.value = ''; // Clear the input field

        // Optional: Display a "thinking..." message
        const thinkingMessageId = `thinking-${Date.now()}`;
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = thinkingMessageId;
        thinkingDiv.classList.add('message', 'ai-message', 'thinking');
        thinkingDiv.textContent = 'Gemini is thinking...';
        chatBox.appendChild(thinkingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // The backend expects a JSON object with a "message" key
                body: JSON.stringify({ message: userMessageText }),
            });

            // Remove the "thinking..." message
            const thinkingElement = document.getElementById(thinkingMessageId);
            if (thinkingElement) {
                chatBox.removeChild(thinkingElement);
            }

            if (!response.ok) {
                let errorMessage = `Error: ${response.status}`; // Default error
                try {
                    const errorData = await response.json();
                    // Your backend returns errors in "reply" or "error" fields
                    errorMessage = errorData.reply || errorData.error || `Server error: ${response.statusText}`;
                } catch (e) {
                    // If parsing error JSON fails, use the status text or a generic message
                    errorMessage = `Server error: ${response.status} ${response.statusText || 'Failed to get a valid error response.'}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Your backend returns the AI's response in the "response" field
            appendMessage('Gemini', data.response);

        } catch (error) {
            const thinkingElement = document.getElementById(thinkingMessageId); // Try to remove thinking message again in case of network error
            if (thinkingElement && chatBox.contains(thinkingElement)) chatBox.removeChild(thinkingElement);
            console.error('Error sending message to backend:', error);
            appendMessage('Error', error.message || 'Could not connect to the AI. Please check your connection or try again later.');
        }
    });
});
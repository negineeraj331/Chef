document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatContainer = document.getElementById('chatContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clearChatBtn = document.getElementById('clearChat');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const aiProviderSelect = document.getElementById('aiProvider');
    
    // Chat history for context
    let chatHistory = [];
    
    // Event listener for chat form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input field
        userInput.value = '';
        
        // Add to chat history
        chatHistory.push({ role: "user", content: message });
        
        // Show loading indicator
        loadingOverlay.classList.remove('d-none');
        
        // Send message to server with selected provider
        const selectedProvider = aiProviderSelect ? aiProviderSelect.value : 'openrouter';
        sendMessageToServer(message, selectedProvider);
    });
    
    // Event listener for suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestion = this.getAttribute('data-suggestion');
            userInput.value = suggestion;
            chatForm.dispatchEvent(new Event('submit'));
        });
    });
    
    // Event listener for clear chat button
    clearChatBtn.addEventListener('click', function() {
        // Clear chat UI except for the first welcome message
        const welcomeMessage = chatContainer.firstElementChild;
        chatContainer.innerHTML = '';
        chatContainer.appendChild(welcomeMessage);
        
        // Clear chat history
        chatHistory = [];
    });
    
    // Function to add message to chat
    function addMessageToChat(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        
        // Process markdown-like content (basic processing for simplicity)
        content = processMessageContent(content);
        
        contentDiv.innerHTML = content;
        messageDiv.appendChild(contentDiv);
        
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Function to process message content for formatting
    function processMessageContent(content) {
        // Convert newlines to <br>
        content = content.replace(/\n/g, '<br>');
        
        // Convert ```code``` to <pre><code>code</code></pre>
        content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert `code` to <code>code</code>
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert **bold** to <strong>bold</strong>
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>italic</em>
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert URLs to clickable links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        return content;
    }
    
    // Function to send message to server
    function sendMessageToServer(message, provider) {
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                provider: provider
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Server error');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingOverlay.classList.add('d-none');
            
            if (data.error) {
                // Show error message
                addMessageToChat('assistant', `<div class="alert alert-warning mb-0">
                    <i class="fas fa-exclamation-triangle me-2"></i> ${data.error}
                </div>`);
            } else {
                // Show assistant response
                addMessageToChat('assistant', data.response);
                
                // Add to chat history
                chatHistory.push({ role: "assistant", content: data.response });
                
                // Add small provider badge if we have this info
                if (data.provider) {
                    const lastMessage = chatContainer.lastElementChild;
                    const badge = document.createElement('div');
                    badge.className = 'provider-badge';
                    badge.innerHTML = `<small class="text-muted">via ${data.provider === 'openai' ? 'OpenAI' : 'OpenRouter'}</small>`;
                    lastMessage.appendChild(badge);
                }
            }
        })
        .catch(error => {
            // Hide loading indicator
            loadingOverlay.classList.add('d-none');
            
            console.error('Error:', error);
            
            // Show error message
            addMessageToChat('assistant', `<div class="alert alert-danger mb-0">
                <i class="fas fa-exclamation-circle me-2"></i> ${error.message || 'Sorry, there was an error processing your request. Please try again.'}
            </div>`);
        });
    }
});

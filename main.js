function responseData(message) {
  return fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'model': 'model-identifier',
      'messages': [
        {
          'role': 'user',
          'content': message
        }
      ],
      'temperature': 0.7,
      'max_tokens': -1,
      'stream': true
    })
  }).then((response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let responseData = ''; // Accumulate the response data

    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          return responseData; // Return the accumulated response data
        }

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        // Process and extract content from each response
        let delimiterIndex;
        while ((delimiterIndex = result.indexOf('\n')) !== -1) {
          const line = result.slice(0, delimiterIndex).trim();
          result = result.slice(delimiterIndex + 1);

          if (line.startsWith('data:')) {
            const jsonData = line.slice(5).trim();
            try {
              const responseObj = JSON.parse(jsonData);
              const content = responseObj.choices[0].delta.content;
              if (content) {
                // Accumulate the content into the responseData string
                responseData += content + ' ';
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }

        return readStream();
      });
    }

    return readStream();
  }).catch((error) => {
    // Handle any errors that occur during the fetch request
    console.error('Fetch request error:', error);
  });
}


const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', () => {
  sendMessage();
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === 'Return') {
    event.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value;
  if (message.trim() !== '') {
    appendMessage('You', message, 'sender-message');
    messageInput.value = '';
    generateResponse(message);
  }
}

function appendMessage(sender, message, messageClass) {
  const messageElement = document.createElement('p');
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  messageElement.classList.add(messageClass);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function generateResponse(InputMessage) {

  responseData(InputMessage).then((response) => {
    console.log(response); 
    // Log the accumulated response string
    setTimeout(() => {
      appendMessage('Bot', response, 'receiver-message');
    }, 10);
  }).catch((error) => {
    console.error('Error:', error);
  });
  
  /*
  const responses = [
    "Hello!",
    "How can I assist you?",
    "That's interesting!",
    "Tell me more.",
    "I'm here to help."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  setTimeout(() => {
    appendMessage('Bot', randomResponse, 'receiver-message');
  }, 500);
  */
}


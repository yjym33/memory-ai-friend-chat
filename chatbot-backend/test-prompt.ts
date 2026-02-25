
import axios from 'axios';

async function testPrompt() {
    console.time('prompt_generation');
    try {
        const response = await axios.post('http://localhost:3002/api/v1/prompt', {
            userId: 'test-user',
            conversationId: '123',
            message: 'nestjs의 핵심 개념에 대해서 설명해주세요',
            aiSettings: {
                personalityType: '친근함',
                speechStyle: '반말',
                emojiUsage: 3,
                empathyLevel: 3,
                nickname: '친구'
            }
        });
        console.timeEnd('prompt_generation');
        console.log('Response length:', response.data.systemPrompt.length);
        console.log('Messages count:', response.data.messages.length);
    } catch (error) {
        console.timeEnd('prompt_generation');
        console.error('Error:', error.message);
    }
}

testPrompt();

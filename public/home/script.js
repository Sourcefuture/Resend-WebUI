//Set Your Remote Server IP
const url = 'https://example.com';

// 退出按钮逻辑
document.addEventListener('DOMContentLoaded', function () {
    // 获取按钮元素
    const exitButton = document.querySelector('.exit-btn');

    // 添加一个点击事件监听器
    exitButton.addEventListener('click', function (event) {
        // 在点击按钮时执行额外的代码
        localStorage.removeItem('auth_token');
        window.location.href = '..';
    });
});

// 简单的启用/禁用按钮逻辑
const senderEmail = document.getElementById('sender-email');
const senderName = document.getElementById('sender-name');
const receiverEmail = document.getElementById('receiver-email');
const emailSubject = document.getElementById('email-subject');
const emailContent = document.getElementById('email-content');
const sendButton = document.getElementById('send-button');

function checkForm() {
    if (senderEmail.value && senderName.value && receiverEmail.value && emailContent.value && emailSubject.value) {
        sendButton.disabled = false;
    } else {
        sendButton.disabled = true;
    }
}

senderEmail.addEventListener('input', checkForm);
senderName.addEventListener('input', checkForm);
receiverEmail.addEventListener('input', checkForm);
emailSubject.addEventListener('input', checkForm);
emailContent.addEventListener('input', checkForm);

// 发送邮件的函数
sendButton.addEventListener('click', async () => {

    const emailData = {
        senderEmail: senderEmail.value,
        senderName: senderName.value,
        receiverEmail: receiverEmail.value,
        emailSubject: emailSubject.value,
        emailContent: emailContent.value
    };

    console.log(JSON.stringify(emailData));
    try {
        const token = localStorage.getItem('auth_token');

        const response = await fetch(url + '/sendmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();
        if (response.ok) {
            console.log(result);
            alert('邮件发送成功');
            你可以在这里清空表单或做其他操作
            senderEmail.value = '';
            senderName.value = '';
            receiverEmail.value = '';
            emailSubject.value = '';
            emailContent.value = '';
            sendButton.disabled = true;
        } else {
            alert('邮件发送失败：' + result.error);
        }
    } catch (error) {
        console.error('发送失败:', error);
        alert('发送失败，请稍后再试');
    }
});

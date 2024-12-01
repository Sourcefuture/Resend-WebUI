//Set Your Remote Server IP
const url = 'https://example.com';

window.onload = function() {
    const resetDisplay = document.getElementById('error-message');
    resetDisplay.style.display = 'none'; // 显示错误信息
};

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // 阻止表单的默认提交行为

    const form = event.target;
    const formData = new FormData(form);
    const secret = formData.get('secret'); // 获取用户输入的密码

    const data = {
        password: secret
    };

    // 创建一个 XMLHttpRequest 或使用 Fetch 发送请求
    fetch(url + "/verify-password", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // 告诉后端请求体是 JSON 格式
          },
        body: JSON.stringify(data), // 将表单数据发送到服务器
    })
    .then(response => response.json()) // 解析 JSON 响应
    .then(data => {
        if (data.success) {
            const token = data.token;
            localStorage.setItem('auth_token', token);
            window.location.href = './home';
            // 如果密码验证成功，重定向或做其他操作
        } else {
            // 如果密码错误，显示错误信息
            const errorMessageElement = document.getElementById('error-message');
            errorMessageElement.textContent = data.message; // 设置错误信息
            errorMessageElement.style.display = 'block'; // 显示错误信息
        }
    })
    .catch(error => {
        console.error('错误发生:', error);
    });
});

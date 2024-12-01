const PASSWORD = "Set Your PassWord Here";
const RESEND_API = "Enter Your Resend API Secret Here";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',  // 允许所有来源
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  // 允许的请求方法
	'Access-Control-Allow-Headers': '*',  // 允许的请求头
	'Access-Control-Allow-Credentials': 'true',  // 如果需要携带凭证（可选）
};

export default {
	async fetch(req) {
		if (req.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,  // 响应状态码为 204 (No Content)
				headers: corsHeaders,
			});
		}
		const url = new URL(req.url);
		if (url.pathname === '/verify-password') {
			return handlePasswordVerification(req);
		} else if (url.pathname === '/sendmail') {
			return handleSendmail(req);
		} else {
			return new Response("404 Not Found", { status: 404 });
		}
	}
};

// 密码验证处理函数
async function handlePasswordVerification(req) {
	if (req.method === "POST") {
		try {
			const requestBody = await req.json();
			const password = requestBody.password;

			if (password === PASSWORD) {
				// 如果密码正确，生成 JWT
				const token = await generateJWT({ verified: true });

				return new Response(JSON.stringify({ 'success': true, token }), {
					status: 200,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			} else {
				return new Response(JSON.stringify({ 'success': false, 'message': '密码错误，请重新输入' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}
		} catch (e) {
			return new Response("无效的请求格式", { status: 400 });
		}
	} else {
		return new Response("仅 POST 请求", { status: 405 });
	}
}

// 处理 /sendmail 验证的函数
async function handleSendmail(req) {
	const authHeader = req.headers.get('Authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.slice(7); // 提取 Bearer 后面的 token
		const verified = await verifyJWT(token);

		if (verified) {
			const { senderEmail, senderName, receiverEmail, emailSubject, emailContent } = await req.json();
			if (senderEmail && senderName && receiverEmail && emailSubject && emailContent) {
				if (!hasSpecialCharacters(senderEmail) && !hasSpecialCharacters(senderName) && isValidEmail(receiverEmail)) {
					const url = 'https://api.resend.com/emails';
					const data = {
						from: `${senderName} <${senderEmail}@lcbmasters.com>`,
						to: receiverEmail,
						subject: emailSubject,
						html: emailContent
					};
					const headers = {
						'Authorization': 'Bearer ' + RESEND_API,
						'Content-Type': 'application/json'
					};
					console.log('Email sending:', data);
					try {
						const response = await fetch(url, {
							method: 'POST',
							headers: headers,
							body: JSON.stringify(data)
						});
						// 打印整个响应对象，检查状态码和返回的内容
						console.log('Response:', response);
						if (response.ok) {
							const responseData = await response.json();
							console.log('Email sent successfully:', responseData);
						} else {
							const errorText = await response.text();
							console.error('Error sending email:', errorText);
						}
					} catch (error) {
						console.error('Error sending email:', error);
					}
					// sendEmail(senderName, senderEmail, receiverEmail, emailSubject, emailContent);

					return new Response(JSON.stringify({ 'success': true }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} else {
					return new Response(JSON.stringify({ 'error': '输入内容不合规' }), {
						status: 401,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			} else {
				return new Response(JSON.stringify({ 'error': '缺少必要的字段' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}
		} else {
			return new Response(JSON.stringify({ 'error': '验证失败' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
		}
	} else {
		return new Response(JSON.stringify({ 'error': '未提供有效的认证信息' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
	}
}









// 生成 JWT
async function generateJWT(payload) {
	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const secretKey = "your_secret_key"; // 用于签名的密钥

	// 将 header 和 payload 转换为 base64url 编码
	const encode = (obj) => base64urlEncode(JSON.stringify(obj));

	const headerEncoded = encode(header);
	const payloadEncoded = encode(payload);

	// 拼接 JWT 的前两部分 (Header 和 Payload) 
	const signatureBase = `${headerEncoded}.${payloadEncoded}`;

	// 使用 Web Crypto API 进行 HMAC 签名
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secretKey),
		{ name: "HMAC", hash: { name: "SHA-256" } },
		false,
		["sign"]
	);

	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(signatureBase)
	);

	const signatureArray = new Uint8Array(signatureBuffer);
	const signatureEncoded = base64urlEncode(String.fromCharCode(...signatureArray));

	// 拼接 JWT，包含 Header、Payload 和 Signature
	return `${signatureBase}.${signatureEncoded}`;
}

// 验证 JWT
async function verifyJWT(token) {
	const [headerEncoded, payloadEncoded, signatureEncoded] = token.split('.');

	// 重新计算签名
	const signatureBase = `${headerEncoded}.${payloadEncoded}`;
	const expectedSignature = await generateSignature(signatureBase);

	return expectedSignature === signatureEncoded;
}

// 生成 HMAC 签名
async function generateSignature(signatureBase) {
	const secretKey = "your_secret_key";
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secretKey),
		{ name: "HMAC", hash: { name: "SHA-256" } },
		false,
		["sign"]
	);

	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(signatureBase)
	);

	const signatureArray = new Uint8Array(signatureBuffer);
	return base64urlEncode(String.fromCharCode(...signatureArray));
}

// 定义 base64url 编码函数
function base64urlEncode(str) {
	let base64 = btoa(String.fromCharCode(...new TextEncoder().encode(str)));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hasSpecialCharacters(input) {
	// 检测是否包含空格、换行符或特殊符号
	const regex = /[\s\n\r!@#$%^&*()_+=[\]{}|;:'",.<>?/\\`~]/;

	// 检查字符串是否匹配正则
	return regex.test(input);
}

function isValidEmail(email) {
	// 正则表达式检查邮箱格式
	const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	return regex.test(email);
}

// async function sendEmail(name, from, to, subject, html) {
// 	const url = 'https://api.resend.com/emails';

// 	const data = {
// 		from: `${name} <${from}@lcbmasters.com>`,
// 		to: to,
// 		subject: subject,
// 		html: html
// 	};

// 	const headers = {
// 		'Authorization': 'Bearer re_Ajae1wXL_AxG7gZ8tvXN8dhJYY4JotJoW',
// 		'Content-Type': 'application/json'
// 	};

// 	console.log('Email sending:', data);

// 	try {
// 		const response = await fetch(url, {
// 			method: 'POST',
// 			headers: headers,
// 			body: JSON.stringify(data)
// 		});

// 		// 打印整个响应对象，检查状态码和返回的内容
// 		console.log('Response:', response);

// 		if (response.ok) {
// 			const responseData = await response.json();
// 			console.log('Email sent successfully:', responseData);
// 			return (responseData);
// 		} else {
// 			const errorText = await response.text();
// 			console.error('Error sending email:', errorText);
// 			return ("error");
// 		}
// 	} catch (error) {
// 		console.error('Error sending email:', error);
// 		return ("error");
// 	}


// }


// async function sendEmail(name, from, to, subject, html) {
//     const url = 'https://api.resend.com/emails';

//     const data = {
//         from: `${name} <${from}@lcbmasters.com>`,
//         to: to,
//         subject: subject,
//         html: html
//     };

//     const headers = {
//         'Authorization': 'Bearer re_Ajae1wXL_AxG7gZ8tvXN8dhJYY4JotJoW',
//         'Content-Type': 'application/json'
//     };
//     console.log('Email sending:', data);
//     try {
//         const response = await axios.post(url, data, { headers });
//         const responseData = await response.data;

//         // 打印响应数据
//         console.log('Email sent successfully:', responseData);
//     } catch (error) {
//         console.error('Error sending email:', error);
//     }
// }
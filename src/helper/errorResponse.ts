export const getErrorHtml = (message: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oops! An Error Occurred</title>
    <style>
        :root {
            --primary: #FF6B6B;
            --secondary: #4ECDC4;
            --dark: #2F3542;
            --light: #F1F2F6;
            --glass: rgba(255, 255, 255, 0.1);
        }

        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: radial-gradient(circle at top right, #2F3542, #1e222b);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--light);
            overflow: hidden;
        }

        .background-blob {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(255, 107, 107, 0.15) 0%, rgba(0,0,0,0) 70%);
            border-radius: 50%;
            top: -200px;
            right: -200px;
            z-index: 0;
            animation: pulse 10s infinite alternate;
        }

        .container {
            position: relative;
            z-index: 1;
            text-align: center;
            background: var(--glass);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 4rem 3rem;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            max-width: 480px;
            width: 90%;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .icon-wrapper {
            font-size: 5rem;
            margin-bottom: 1.5rem;
            text-shadow: 0 10px 20px rgba(0,0,0,0.3);
            animation: float 6s ease-in-out infinite;
        }

        h1 {
            font-size: 3rem;
            font-weight: 800;
            margin: 0 0 1rem;
            background: linear-gradient(135deg, #FF6B6B, #FFE66D);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -1px;
        }

        p {
            font-size: 1.125rem;
            color: #a4b0be;
            margin-bottom: 2.5rem;
            line-height: 1.6;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 14px 36px;
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
            color: white;
            text-decoration: none;
            border-radius: 100px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
            border: none;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .btn:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 30px rgba(255, 107, 107, 0.4);
        }

        .btn:active {
            transform: translateY(-1px);
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes slideUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="background-blob"></div>
    <div class="container">
        <div class="icon-wrapper">😕</div>
        <h1>Oops!</h1>
        <p>${message || "We encountered an unexpected issue while processing your request."}</p>
        <a href="/" class="btn" onclick="history.back(); return false;">Go Back</a>
    </div>
</body>
</html>
`;

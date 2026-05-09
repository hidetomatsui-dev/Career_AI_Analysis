export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let to, subject, result;
  try {
    const body = await req.json();
    to = body.to;
    subject = body.subject || '職業適性 AI 分析レポート';
    result = body.result;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'リクエストの読み込みに失敗しました' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!to || !result) {
    return new Response(JSON.stringify({ error: 'メールアドレスまたは分析結果が不足しています' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const htmlBody = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>職業適性 AI 分析レポート</title>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ヘッダー -->
        <tr><td style="background:#1a1917;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;color:#9c9a95;text-transform:uppercase;">四柱推命 × キャリアレポート</p>
          <h1 style="margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:3px;">職業適性 AI アナライザー</h1>
        </td></tr>

        <!-- 本文 -->
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid rgba(0,0,0,0.08);border-right:1px solid rgba(0,0,0,0.08);">
          <p style="margin:0 0 24px;font-size:13px;color:#6b6860;line-height:1.8;">
            あなたの職業適性 AI 分析レポートをお送りします。<br>
            四柱推命の天命レポートとキャリアレポートを統合した総合分析です。
          </p>
          <div style="background:#faf9f7;border-radius:8px;padding:24px;border:1px solid rgba(0,0,0,0.08);">
            <pre style="margin:0;font-size:13px;line-height:1.9;color:#1a1917;white-space:pre-wrap;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;">${result.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        </td></tr>

        <!-- フッター -->
        <tr><td style="background:#f2f0ec;border-radius:0 0 12px 12px;padding:20px 32px;border:1px solid rgba(0,0,0,0.08);border-top:none;">
          <p style="margin:0;font-size:11px;color:#9c9a95;text-align:center;line-height:1.8;">
            このメールは <a href="https://career-ai-analysis.vercel.app" style="color:#6b6860;">職業適性 AI アナライザー</a> から送信されました。<br>
            お仕事占い：<a href="https://shimeibo-app.vercel.app" style="color:#6b6860;">shimeibo-app.vercel.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Career AI <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'メール送信エラー: ' + rawText.slice(0, 200) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message || JSON.stringify(data.error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

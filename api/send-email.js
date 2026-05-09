export const config = { runtime: 'edge' };

function markdownToHtml(text) {
  return text
    // コードブロック（```）を除去
    .replace(/```[\s\S]*?```/g, '')
    // --- 区切り線
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e0ddd8;margin:20px 0;">')
    // ## 見出し2
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;color:#1a1917;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0ede8;">$1</h2>')
    // ### 見出し3
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:600;color:#3a3835;margin:20px 0 8px;">$1</h3>')
    // #### 見出し4
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:13px;font-weight:600;color:#3a3835;margin:16px 0 6px;">$1</h4>')
    // ■ セクション見出し
    .replace(/^■ (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;color:#1a1917;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #e0ddd8;">■ $1</h2>')
    // **太字**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // *斜体*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // - 箇条書き
    .replace(/^[-・] (.+)$/gm, '<li style="margin:5px 0;line-height:1.7;">$1</li>')
    // 番号付きリスト
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:6px 0;line-height:1.7;">$1</li>')
    // <li>をulで囲む（連続するliをグループ化）
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:8px 0;padding-left:20px;">${m}</ul>`)
    // 空行を段落に
    .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.8;">')
    // 残りの改行
    .replace(/\n/g, '<br>')
    // 全体をpで囲む
    .replace(/^(.)/,'<p style="margin:8px 0;line-height:1.8;">$1')
    .replace(/(.)$/,'$1</p>');
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  let to, subject, result;
  try {
    const body = await req.json();
    to = body.to;
    subject = body.subject || '職業適性 AI 分析レポート';
    result = body.result;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'リクエストエラー' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!to || !result) {
    return new Response(JSON.stringify({ error: 'メールアドレスまたは分析結果が不足しています' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const htmlContent = markdownToHtml(result);

  const htmlBody = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ヘッダー -->
        <tr><td style="background:#1a1917;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;color:#9c9a95;text-transform:uppercase;">四柱推命 × キャリアレポート</p>
          <h1 style="margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:2px;">職業適性 AI アナライザー</h1>
          <p style="margin:12px 0 0;font-size:12px;color:#9c9a95;">総合 職業適性レポート</p>
        </td></tr>

        <!-- リード文 -->
        <tr><td style="background:#ffffff;padding:28px 32px 16px;border-left:1px solid #e8e4de;border-right:1px solid #e8e4de;">
          <p style="margin:0;font-size:13px;color:#6b6860;line-height:1.8;">
            四柱推命の天命レポートとキャリアレポートを統合した、あなたの職業適性 AI 分析レポートをお届けします。
          </p>
        </td></tr>

        <!-- 本文 -->
        <tr><td style="background:#ffffff;padding:8px 32px 32px;border-left:1px solid #e8e4de;border-right:1px solid #e8e4de;font-size:13.5px;color:#1a1917;line-height:1.8;">
          ${htmlContent}
        </td></tr>

        <!-- フッター -->
        <tr><td style="background:#f2f0ec;border-radius:0 0 12px 12px;padding:20px 32px;border:1px solid #e8e4de;border-top:none;">
          <p style="margin:0;font-size:11px;color:#9c9a95;text-align:center;line-height:1.8;">
            このメールは <a href="https://career-ai-analysis.vercel.app" style="color:#6b6860;text-decoration:none;">職業適性 AI アナライザー</a> から送信されました。<br>
            お仕事占い：<a href="https://shimeibo-app.vercel.app" style="color:#6b6860;text-decoration:none;">shimeibo-app.vercel.app</a>
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
    try { data = JSON.parse(rawText); }
    catch (e) {
      return new Response(JSON.stringify({ error: 'メール送信エラー: ' + rawText.slice(0, 200) }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message || JSON.stringify(data.error) }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

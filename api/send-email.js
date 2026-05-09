export const config = { runtime: 'edge' };

function markdownToHtml(text) {
  text = text.replace(/\n{3,}/g, '\n\n');
  for (var _i = 0; _i < 5; _i++) {
    var _prev = text;
    text = text.replace(/([ \t]*[-*・][ \t]+[^\n]+)\n\n([ \t]*[-*・][ \t])/g, '$1\n$2');
    if (text === _prev) break;
  }
  text = text.replace(/^\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)*)/gm, function(m, header, rows) {
    var thS = 'padding:8px 12px;background:#f2f0ec;font-weight:600;font-size:12px;text-align:left;border:1px solid #ddd;';
    var tdS = 'padding:8px 12px;font-size:13px;border:1px solid #e0ddd8;line-height:1.6;vertical-align:top;';
    var ths = header.split('|').map(function(s){return s.trim();}).filter(Boolean)
      .map(function(c){return '<th style="'+thS+'">'+c+'</th>';}).join('');
    var trs = rows.trim().split('\n').filter(Boolean).map(function(row){
      return '<tr>'+row.split('|').map(function(s){return s.trim();}).filter(Boolean)
        .map(function(c){return '<td style="'+tdS+'">'+c+'</td>';}).join('')+'</tr>';
    }).join('');
    return '<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr>'+ths+'</tr></thead><tbody>'+trs+'</tbody></table>';
  });
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e0ddd8;margin:14px 0;">');
  text = text.replace(/^## ■\s*(.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#1a1917;margin:20px 0 7px;padding-bottom:5px;border-bottom:2px solid #e0ddd8;">■ $1</h2>');
  text = text.replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#1a1917;margin:20px 0 7px;padding-bottom:4px;border-bottom:1px solid #e0ddd8;">$1</h2>');
  text = text.replace(/^■\s*(.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#1a1917;margin:20px 0 7px;padding-bottom:5px;border-bottom:2px solid #e0ddd8;">■ $1</h2>');
  text = text.replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;color:#3a3835;margin:14px 0 4px;">$1</h3>');
  text = text.replace(/^#### (.+)$/gm, '<h4 style="font-size:13px;font-weight:600;color:#5a5855;margin:9px 0 3px;">$1</h4>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^\s*][^*]*)\*/g, '<em>$1</em>');
  text = text.replace(/^\s*[-*]\s*$/gm, '');
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, '<li style="margin:2px 0;line-height:1.55;">$1</li>');
  text = text.replace(/^\s*[-*・]\s+(.+)$/gm, '<li style="margin:2px 0;line-height:1.55;">$1</li>');
  text = text.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, function(m){
    return '<ul style="margin:3px 0;padding-left:18px;">'+m+'</ul>';
  });
  text = text.replace(/<\/ul>\s*<ul[^>]*>/g, '');
  text = text.split('\n\n').map(function(para){
    para = para.trim();
    if (!para) return '';
    if (/^<[hHutpd]/.test(para)) return para;
    return '<p style="margin:4px 0;line-height:1.6;">'+para.replace(/\n/g,'<br>')+'</p>';
  }).join('\n');
  return text;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  var to, subject, result;
  try {
    var body = await req.json();
    to = body.to; subject = body.subject || '職業適性 AI 分析レポート'; result = body.result;
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

  var htmlContent = markdownToHtml(result);

  var htmlBody = '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#faf9f7;font-family:\'Helvetica Neue\',Arial,\'Hiragino Sans\',sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 16px;"><tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">'
    + '<tr><td style="background:#1a1917;border-radius:12px 12px 0 0;padding:32px;text-align:center;">'
    + '<p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;color:#9c9a95;text-transform:uppercase;">四柱推命 × キャリアレポート</p>'
    + '<h1 style="margin:0;font-size:22px;font-weight:300;color:#fff;letter-spacing:2px;">職業適性 AI アナライザー</h1>'
    + '<p style="margin:12px 0 0;font-size:12px;color:#9c9a95;">総合 職業適性レポート</p></td></tr>'
    + '<tr><td style="background:#fff;padding:28px 32px 16px;border-left:1px solid #e8e4de;border-right:1px solid #e8e4de;">'
    + '<p style="margin:0;font-size:13px;color:#6b6860;line-height:1.8;">四柱推命の天命レポートとキャリアレポートを統合した、あなたの職業適性 AI 分析レポートをお届けします。</p></td></tr>'
    + '<tr><td style="background:#fff;padding:8px 32px 32px;border-left:1px solid #e8e4de;border-right:1px solid #e8e4de;font-size:13.5px;color:#1a1917;line-height:1.6;">'
    + htmlContent + '</td></tr>'
    + '<tr><td style="background:#f2f0ec;border-radius:0 0 12px 12px;padding:20px 32px;border:1px solid #e8e4de;border-top:none;">'
    + '<p style="margin:0;font-size:11px;color:#9c9a95;text-align:center;line-height:1.8;">'
    + 'このメールは <a href="https://career-ai-analysis.vercel.app" style="color:#6b6860;text-decoration:none;">職業適性 AI アナライザー</a> から送信されました。<br>'
    + 'お仕事占い：<a href="https://shimeibo-app.vercel.app" style="color:#6b6860;text-decoration:none;">shimeibo-app.vercel.app</a>'
    + '</p></td></tr></table></td></tr></table></body></html>';

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY },
      body: JSON.stringify({ from: 'Career AI <onboarding@resend.dev>', to: [to], subject: subject, html: htmlBody }),
    });
    var rawText = await response.text();
    var data;
    try { data = JSON.parse(rawText); }
    catch (e) { return new Response(JSON.stringify({ error: rawText.slice(0, 200) }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
    if (data.error) return new Response(JSON.stringify({ error: data.error.message || JSON.stringify(data.error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

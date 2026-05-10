export const config = { runtime: 'edge' };

function formatInline(t) {
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^\s*][^*]*)\*/g, '<em>$1</em>');
  return t;
}

function markdownToHtml(text) {
  var thS = 'padding:8px 12px;background:#f2f0ec;font-weight:600;font-size:12px;text-align:left;border:1px solid #ddd;';
  var tdS = 'padding:8px 12px;font-size:13px;border:1px solid #e0ddd8;line-height:1.6;vertical-align:top;';
  var h2S = 'font-size:15px;font-weight:700;color:#1a1917;margin:18px 0 6px;padding-bottom:5px;border-bottom:2px solid #e0ddd8;';
  var h3S = 'font-size:13px;font-weight:700;color:#3a3835;margin:12px 0 4px;';
  var h4S = 'font-size:13px;font-weight:600;color:#5a5855;margin:8px 0 3px;';
  var pS  = 'margin:3px 0;line-height:1.6;font-size:13.5px;';
  var liS = 'margin:2px 0;line-height:1.55;';
  var ulS = 'margin:3px 0;padding-left:18px;';
  var hrS = 'border:none;border-top:1px solid #e0ddd8;margin:14px 0;';

  // テーブル変換（行ごと処理の前に実施）
  text = text.replace(/^\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)*)/gm, function(m, header, rows) {
    var ths = header.split('|').map(function(s){return s.trim();}).filter(Boolean)
      .map(function(c){return '<th style="'+thS+'">'+c+'</th>';}).join('');
    var trs = rows.trim().split('\n').filter(Boolean).map(function(row){
      return '<tr>'+row.split('|').map(function(s){return s.trim();}).filter(Boolean)
        .map(function(c){return '<td style="'+tdS+'">'+c+'</td>';}).join('')+'</tr>';
    }).join('');
    return '%%%TABLE%%%<table style="width:100%;border-collapse:collapse;margin:10px 0;"><thead><tr>'+ths+'</tr></thead><tbody>'+trs+'</tbody></table>%%%ENDTABLE%%%';
  });

  var lines = text.split('\n');
  var html = '';
  var inList = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var tr = line.trim();
    if (!tr || /^```/.test(tr)) { continue; }
    if (/^%%%TABLE%%%/.test(tr)) { 
      if (inList) { html += '</ul>'; inList = false; }
      html += tr.replace(/%%%TABLE%%%|%%%ENDTABLE%%%/g, ''); 
      continue; 
    }
    var isBullet = /^\s*[-*・]\s+/.test(line);
    var isNum    = /^\s*\d+\.\s+/.test(line);
    if (isBullet || isNum) {
      if (!inList) { html += '<ul style="'+ulS+'">'; inList = true; }
      var content = tr.replace(/^\s*[-*・]\s+/, '').replace(/^\s*\d+\.\s+/, '');
      html += '<li style="'+liS+'">' + formatInline(content) + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if      (/^## ■/.test(tr))  html += '<h2 style="'+h2S+'">■ ' + formatInline(tr.replace(/^## ■\s*/,'')) + '</h2>';
      else if (/^## /.test(tr))   html += '<h2 style="'+h2S+'">' + formatInline(tr.replace(/^## /,'')) + '</h2>';
      else if (/^■/.test(tr))     html += '<h2 style="'+h2S+'">' + formatInline(tr) + '</h2>';
      else if (/^### /.test(tr))  html += '<h3 style="'+h3S+'">' + formatInline(tr.replace(/^### /,'')) + '</h3>';
      else if (/^#### /.test(tr)) html += '<h4 style="'+h4S+'">' + formatInline(tr.replace(/^#### /,'')) + '</h4>';
      else if (/^---+$/.test(tr)) html += '<hr style="'+hrS+'">';
      else html += '<p style="'+pS+'">' + formatInline(tr) + '</p>';
    }
  }
  if (inList) html += '</ul>';
  return html;
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

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  let shimei, career;
  try {
    const body = await req.json();
    shimei = body.shimei;
    career = body.career;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'リクエストエラー' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!shimei || !career) {
    return new Response(JSON.stringify({ error: '入力データが不足しています' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const prompt = `あなたは四柱推命・キャリア心理学・職業カウンセリングの三分野に精通した専門家です。
以下の2つのデータを統合して、この方に最適な職業・働き方・キャリア戦略を分析してください。

【データ①】四柱推命 天命レポート
${shimei}

【データ②】マイキャリアレポート（RIASEC・価値観・キャリアステートメント）
${career}

以下の構成で日本語でレポートを作成してください。

■ 統合プロファイル
天命タイプとRIASEC・価値観の共通点・相乗効果・補完関係を分析。

■ この方の核となる資質（3〜5項目）
両データから読み取れるコアストレングスを箇条書きで。

■ 特に向いている職業・職種（上位6〜8職種）
「職種名 — 理由」の形式で。

■ 理想の働き方・職場環境

■ 注意点・成長のための課題

■ 今後のキャリアアクション
「今すぐ」「3ヶ月以内」「1年以内」で区分して。`;

  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text();
    return new Response(JSON.stringify({ error: errText.slice(0, 300) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Anthropic のSSEストリームをそのままクライアントに流す
  return new Response(anthropicResp.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

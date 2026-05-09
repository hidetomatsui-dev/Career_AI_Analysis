export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shimei, career } = req.body;

  if (!shimei || !career) {
    return res.status(400).json({ error: '入力データが不足しています' });
  }

  const prompt = `あなたは四柱推命・キャリア心理学・職業カウンセリングの三分野に精通した専門家です。
以下の2つのデータを統合して、この方に最適な職業・働き方・キャリア戦略を分析してください。

━━━━━━━━━━━━━━━━━━━
【データ①】四柱推命 天命レポート（お仕事占い）
━━━━━━━━━━━━━━━━━━━
${shimei}

━━━━━━━━━━━━━━━━━━━
【データ②】マイキャリアレポート（RIASEC職業興味・価値観・キャリアステートメント）
━━━━━━━━━━━━━━━━━━━
${career}

━━━━━━━━━━━━━━━━━━━
以下の構成でレポートを作成してください。

■ 統合プロファイル
天命タイプとRIASEC・価値観の共通点・相乗効果・補完関係を200字程度で分析。

■ この方の核となる資質（3〜5項目）
両データから読み取れるコアストレングスを箇条書きで。

■ 特に向いている職業・職種（上位6〜8職種）
「職種名 — 理由（天命レポートとキャリアデータの両方の根拠を示しながら）」の形式で。

■ 理想の働き方・職場環境
組織形態・仕事スタイル・チームの規模感など。

■ 注意点・成長のための課題
避けたほうが良い環境や、バランスをとると良い点。

■ 今後のキャリアアクション（具体的な3ステップ）
「今すぐ」「3ヶ月以内」「1年以内」で区分して実践的に。

温かく、かつ具体的・実践的なトーンで日本語で回答してください。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = (data.content || []).map(b => b.text || '').join('').trim();
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

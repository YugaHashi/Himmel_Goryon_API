export default async function handler(req, res) {
  if (req.method === 'POST') {
    return res.status(200).json({ message: 'Success! API is working!' });
  } else if (req.method === 'OPTIONS') {
    // CORS対応
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

'use client';

/**
 * Debug page to check environment variables in the browser
 */
export default function EnvDebugPage() {
  const envVars = {
    NEXT_PUBLIC_FEATURE_REALTIME_CHAT: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT,
    NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER,
    NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>

      <h2>Feature Flag Check:</h2>
      <p>REALTIME_CHAT enabled: {envVars.NEXT_PUBLIC_FEATURE_REALTIME_CHAT === 'true' ? '✅ YES' : '❌ NO'}</p>
      <p>Raw value: "{envVars.NEXT_PUBLIC_FEATURE_REALTIME_CHAT}"</p>

      <h2>Instructions:</h2>
      <ul>
        <li>If you see "undefined", the env vars are not loaded</li>
        <li>If you see "true", the feature should work</li>
        <li>If you see "false", check your .env.local file</li>
      </ul>
    </div>
  );
}

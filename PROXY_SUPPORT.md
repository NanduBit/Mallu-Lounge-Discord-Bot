# Proxy Support for Discord API Rate Limiting

This bot includes automatic proxy support to handle Discord API rate limits. The proxy feature uses [Proxifly](https://proxifly.dev) to fetch free HTTP, HTTPS, and SOCKS proxies.

## How It Works

The proxy system is designed to be **reactive** and **automatic**:

1. **Normal Operation**: The bot runs with a direct connection (no proxy)
2. **Rate Limit Detected**: When Discord returns a rate limit error, the proxy is automatically activated
3. **Proxy Active**: While rate limited, all Discord API requests go through a proxy
4. **Rate Limit Resolved**: After 60 seconds without rate limits, the proxy is automatically deactivated
5. **Back to Normal**: The bot returns to direct connection

### Automatic Proxy Rotation

- If rate limits persist even with a proxy, the system automatically rotates to a new proxy
- Failed proxies are tracked and avoided
- Up to 3 retry attempts to find a working proxy

## Configuration

Edit `src/config.js` to enable proxy support:

```javascript
module.exports = {
  // ... other config options ...
  
  // Proxy configuration
  proxyEnabled: true, // Set to true to enable automatic proxy on rate limit
  proxiflyApiKey: null, // Optional: Get API key from https://proxifly.dev for better limits
};
```

### Configuration Options

- **proxyEnabled**: `true` to enable proxy support, `false` to disable (default: `true`)
- **proxiflyApiKey**: Optional API key for Proxifly
  - Without a key: 1 proxy per request (free tier)
  - With a key: Up to 20 proxies per request + better limits
  - Get your API key at https://proxifly.dev

## Features

### ProxyManager (`src/utils/proxyManager.js`)

Handles fetching and managing proxies:
- Fetches proxies from Proxifly with filtering options
- Supports HTTP, HTTPS, SOCKS4, and SOCKS5 proxies
- Filters by anonymity level (anonymous/elite only)
- Filters by speed (< 5000ms connection time)
- Tracks failed proxies to avoid reusing them
- Creates appropriate proxy agents (HttpsProxyAgent or SocksProxyAgent)

### RateLimitHandler (`src/utils/rateLimitHandler.js`)

Monitors Discord API rate limits and manages proxy activation:
- Listens for Discord rate limit events
- Automatically activates proxy when rate limited
- Automatically deactivates proxy after 60s with no rate limits
- Rotates to new proxy if rate limits persist
- Provides status information about current proxy state

## Dependencies

The following npm packages are required:
- `proxifly` - Proxy API client
- `https-proxy-agent` - HTTP/HTTPS proxy support
- `socks-proxy-agent` - SOCKS4/SOCKS5 proxy support

These are automatically installed when you run `npm install`.

## Usage Examples

### Check Proxy Status

You can check if the proxy is currently active:

```javascript
if (client.rateLimitHandler) {
  const status = client.rateLimitHandler.getStatus();
  console.log('Proxy Active:', status.proxyActive);
  console.log('Rate Limit Count:', status.rateLimitCount);
  console.log('Current Proxy:', status.currentProxy);
}
```

### Manual Proxy Rotation

If needed, you can manually rotate the proxy:

```javascript
if (client.rateLimitHandler) {
  await client.rateLimitHandler.rotateProxyNow();
}
```

### Check Public IP

Verify your connection through the proxy:

```javascript
if (client.proxyManager) {
  const ipInfo = await client.proxyManager.checkPublicIp();
  console.log('Public IP:', ipInfo.ip);
  console.log('Location:', ipInfo.geolocation);
}
```

## Logging

The proxy system provides detailed logging:

- `✅ Proxy manager initialized (will activate on rate limit)` - System ready
- `⚠️ Rate limited: {...}` - Rate limit detected
- `🔄 Rate limit detected! Activating proxy...` - Proxy being activated
- `✅ Proxy activated successfully` - Proxy is now active
- `✅ No rate limits detected for cooldown period. Deactivating proxy...` - Proxy being disabled
- `✅ Proxy deactivated, back to direct connection` - Back to normal operation
- `🔄 Still rate limited with proxy, rotating to a new proxy...` - Switching proxies

## Troubleshooting

### Proxy Not Working?

1. **Check if proxy is enabled**: Ensure `proxyEnabled: true` in `config.js`
2. **Check logs**: Look for proxy activation messages
3. **API limits**: Free tier is limited to 1 proxy per request. Consider getting an API key.
4. **Proxy quality**: Free proxies may be unreliable. The system automatically rotates to find working ones.

### Still Getting Rate Limited?

- The system needs time to activate the proxy (a few seconds)
- If rate limits are very severe, multiple proxy rotations may be needed
- Consider adding a Proxifly API key for access to more proxies

## How to Disable

Set `proxyEnabled: false` in `src/config.js` to completely disable proxy support. The bot will function normally without any proxy features.

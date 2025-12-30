const Proxifly = require('proxifly');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyManager {
  constructor(apiKey = null) {
    this.proxifly = new Proxifly({ apiKey });
    this.currentProxy = null;
    this.proxyAgent = null;
    this.failedProxies = new Set();
    this.maxRetries = 3;
  }

  /**
   * Fetch a new proxy from Proxifly
   * @param {Object} options - Proxy filter options
   * @returns {Promise<Object>} - Proxy object
   */
  async fetchProxy(options = {}) {
    const defaultOptions = {
      protocol: ['http', 'https', 'socks4', 'socks5'],
      anonymity: ['anonymous', 'elite'],
      https: true,
      speed: 5000,
      format: 'json',
      quantity: 1,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const proxy = await this.proxifly.getProxy(mergedOptions);
      console.log('✅ Fetched new proxy:', proxy.proxy);
      return proxy;
    } catch (error) {
      console.error('❌ Failed to fetch proxy:', error.message);
      throw error;
    }
  }

  /**
   * Create a proxy agent based on the protocol
   * @param {Object} proxy - Proxy object from Proxifly
   * @returns {Object} - Proxy agent
   */
  createProxyAgent(proxy) {
    if (!proxy || !proxy.proxy) {
      return null;
    }

    try {
      if (proxy.protocol === 'http' || proxy.protocol === 'https') {
        return new HttpsProxyAgent(proxy.proxy);
      } else if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
        return new SocksProxyAgent(proxy.proxy);
      }
    } catch (error) {
      console.error('❌ Failed to create proxy agent:', error.message);
      return null;
    }

    return null;
  }

  /**
   * Get the current proxy agent or fetch a new one
   * @param {boolean} forceNew - Force fetching a new proxy
   * @returns {Promise<Object>} - Proxy agent
   */
  async getProxyAgent(forceNew = false) {
    if (!forceNew && this.proxyAgent && this.currentProxy) {
      return this.proxyAgent;
    }

    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const proxy = await this.fetchProxy();
        
        // Skip if this proxy has failed before
        if (this.failedProxies.has(proxy.proxy)) {
          retries++;
          continue;
        }

        this.currentProxy = proxy;
        this.proxyAgent = this.createProxyAgent(proxy);
        
        if (this.proxyAgent) {
          return this.proxyAgent;
        }
      } catch (error) {
        console.error(`❌ Proxy fetch attempt ${retries + 1} failed:`, error.message);
      }
      
      retries++;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }

    console.warn('⚠️ Failed to get proxy after max retries, continuing without proxy');
    return null;
  }

  /**
   * Mark current proxy as failed and rotate to a new one
   * @returns {Promise<Object>} - New proxy agent
   */
  async rotateProxy() {
    if (this.currentProxy) {
      this.failedProxies.add(this.currentProxy.proxy);
      console.log('🔄 Rotating proxy due to failure:', this.currentProxy.proxy);
    }

    this.currentProxy = null;
    this.proxyAgent = null;

    return await this.getProxyAgent(true);
  }

  /**
   * Get current proxy information
   * @returns {Object|null} - Current proxy object
   */
  getCurrentProxy() {
    return this.currentProxy;
  }

  /**
   * Check public IP (useful for verifying proxy connection)
   * Note: This will return the proxy's IP if a proxy is currently active
   * @returns {Promise<Object>} - IP information
   */
  async checkPublicIp() {
    try {
      const ipInfo = await this.proxifly.getPublicIp({
        mode: 'IPv4',
        format: 'json',
      });
      console.log('🌐 Public IP:', ipInfo.ip, 'Country:', ipInfo.geolocation?.country);
      return ipInfo;
    } catch (error) {
      console.error('❌ Failed to check public IP:', error.message);
      throw error;
    }
  }

  /**
   * Clear failed proxies list
   */
  clearFailedProxies() {
    this.failedProxies.clear();
    console.log('✅ Cleared failed proxies list');
  }
}

module.exports = ProxyManager;

/**
 * Rate limit handler with proxy rotation support
 * This module helps handle Discord API rate limits by rotating proxies
 * Proxy is only activated when rate limit is detected and disabled when resolved
 */

class RateLimitHandler {
  constructor(client) {
    this.client = client;
    this.rateLimitCount = 0;
    this.proxyActive = false;
    this.cooldownTimer = null;
    this.cooldownPeriod = 60000; // 60 seconds cooldown after last rate limit
    this.setupListeners();
  }

  setupListeners() {
    // Listen for rate limit events
    if (this.client.rest) {
      this.client.rest.on('rateLimited', async (rateLimitInfo) => {
        console.warn('⚠️ Rate limited:', {
          timeout: rateLimitInfo.timeout,
          limit: rateLimitInfo.limit,
          method: rateLimitInfo.method,
          path: rateLimitInfo.path,
          route: rateLimitInfo.route,
        });

        this.rateLimitCount++;

        // Activate proxy if not already active
        if (!this.proxyActive && this.client.proxyManager) {
          await this.activateProxy();
        } else if (this.proxyActive && this.rateLimitCount >= 3) {
          // If proxy is already active but still getting rate limited, rotate to a new proxy
          console.log('🔄 Still rate limited with proxy, rotating to a new proxy...');
          await this.rotateProxyNow();
        }

        // Reset the cooldown timer - proxy stays active while we're getting rate limited
        this.resetCooldownTimer();
      });

      console.log('✅ Rate limit handler initialized');
    }
  }

  /**
   * Activate proxy when rate limit is detected
   */
  async activateProxy() {
    if (!this.client.proxyManager) {
      console.warn('⚠️ Proxy manager not available');
      return false;
    }

    try {
      console.log('🔄 Rate limit detected! Activating proxy...');
      const agent = await this.client.proxyManager.getProxyAgent();
      if (agent && this.client.rest) {
        this.client.rest.setAgent(agent);
        this.proxyActive = true;
        console.log('✅ Proxy activated successfully');
        
        // Start cooldown timer to disable proxy if no more rate limits
        this.resetCooldownTimer();
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to activate proxy:', error.message);
      return false;
    }

    return false;
  }

  /**
   * Deactivate proxy when rate limit is resolved
   */
  deactivateProxy() {
    if (!this.proxyActive) {
      return;
    }

    try {
      console.log('✅ No rate limits detected for cooldown period. Deactivating proxy...');
      if (this.client.rest) {
        this.client.rest.setAgent(null); // Remove proxy agent
      }
      this.proxyActive = false;
      this.rateLimitCount = 0;
      console.log('✅ Proxy deactivated, back to direct connection');
    } catch (error) {
      console.error('❌ Failed to deactivate proxy:', error.message);
    }
  }

  /**
   * Reset the cooldown timer - proxy will be disabled after cooldown period with no rate limits
   */
  resetCooldownTimer() {
    // Clear existing timer
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }

    // Set new timer to deactivate proxy if no more rate limits
    this.cooldownTimer = setTimeout(() => {
      if (this.proxyActive) {
        this.deactivateProxy();
      }
    }, this.cooldownPeriod);
  }

  /**
   * Reset the rate limit counter
   */
  resetCounter() {
    this.rateLimitCount = 0;
    console.log('✅ Rate limit counter reset');
  }

  /**
   * Get current rate limit count
   * @returns {number} - Current rate limit count
   */
  getCount() {
    return this.rateLimitCount;
  }

  /**
   * Check if proxy is currently active
   * @returns {boolean} - Proxy active status
   */
  isProxyActive() {
    return this.proxyActive;
  }

  /**
   * Manually trigger proxy rotation
   */
  async rotateProxyNow() {
    if (!this.client.proxyManager) {
      console.warn('⚠️ Proxy manager not available');
      return false;
    }

    try {
      console.log('🔄 Rotating to a new proxy...');
      const newAgent = await this.client.proxyManager.rotateProxy();
      if (newAgent && this.client.rest) {
        this.client.rest.setAgent(newAgent);
        this.proxyActive = true;
        this.rateLimitCount = 0;
        console.log('✅ Proxy rotated successfully');
        
        // Reset cooldown timer after rotation
        this.resetCooldownTimer();
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to rotate proxy:', error.message);
      return false;
    }

    return false;
  }

  /**
   * Get current proxy status information
   * @returns {Object} - Status object with proxy info
   */
  getStatus() {
    return {
      proxyActive: this.proxyActive,
      rateLimitCount: this.rateLimitCount,
      currentProxy: this.client.proxyManager?.getCurrentProxy()?.proxy || null,
    };
  }
}

module.exports = RateLimitHandler;

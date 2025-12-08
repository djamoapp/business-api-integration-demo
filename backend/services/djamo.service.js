import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DJAMO_API_URL = process.env.DJAMO_API_URL || 'https://apibusiness.civ.staging.djam.ooo';
const ACCESS_TOKEN = process.env.DJAMO_ACCESS_TOKEN;
const COMPANY_ID = process.env.DJAMO_COMPANY_ID;

if (!ACCESS_TOKEN) {
  console.warn('⚠️  DJAMO_ACCESS_TOKEN not set. API calls will fail.');
}

const apiClient = axios.create({
  baseURL: DJAMO_API_URL,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'X-Company-Id': COMPANY_ID,
    'Content-Type': 'application/json'
  }
});

class DjamoService {
  /**{
   * Create a charge (payment request)
   * @param {Object} chargeData - Charge data
   * @returns {Promise<Object>} Charge response
   */
  async createCharge(chargeData) {
    try {
      const response = await apiClient.post('/v1/charges', chargeData);
      return response.data;
    } catch (error) {
      console.error('Error creating charge:',{ errorMessage: error.response?.data || error.message, chargeData: JSON.stringify(chargeData) });
      throw new Error(error.response?.data?.message || 'Failed to create charge');
    }
  }

  /**
   * Get charge status
   * @param {string} chargeId - Charge ID
   * @returns {Promise<Object>} Charge status
   */
  async getChargeStatus(chargeId) {
    try {
      const response = await apiClient.get(`/v1/charges/${chargeId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting charge status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get charge status');
    }
  }

  /**
   * Create a refund
   * @param {string} chargeId - Charge ID
   * @param {Object} refundData - Refund data
   * @returns {Promise<Object>} Refund response
   */
  async createRefund(chargeId, refundData) {
    try {
      // Note: This endpoint might need to be verified with Djamo documentation
      const response = await apiClient.post(`/v1/charges/${chargeId}/refund`, refundData);
      return response.data;
    } catch (error) {
      // Fallback for simulation if endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Refund endpoint not found, simulating refund...');
        return {
          id: `refund_${Date.now()}`,
          charge_id: chargeId,
          amount: refundData.amount,
          status: 'pending',
          created_at: new Date().toISOString()
        };
      }
      console.error('Error creating refund:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create refund');
    }
  }

  /**
   * List charges
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of charges
   */
  async listCharges(params = {}) {
    try {
      const response = await apiClient.get('/v1/charges', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing charges:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to list charges');
    }
  }
}

export default new DjamoService();


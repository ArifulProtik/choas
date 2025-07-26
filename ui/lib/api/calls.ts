import { Api, handleApiCall } from "./api";
import { Call } from "../schemas/messaging";

export class CallsApiService {
  /**
   * Initiate a voice or video call
   */
  static async initiateCall(payload: {
    callee_id: string;
    call_type?: string;
  }): Promise<Call> {
    return handleApiCall(() => Api.post("/calls", payload));
  }

  /**
   * Accept an incoming call
   */
  static async acceptCall(callId: string): Promise<{ message: string }> {
    return handleApiCall(() => Api.post(`/calls/${callId}/accept`));
  }

  /**
   * Decline an incoming call
   */
  static async declineCall(callId: string): Promise<{ message: string }> {
    return handleApiCall(() => Api.post(`/calls/${callId}/decline`));
  }

  /**
   * End an active call
   */
  static async endCall(callId: string): Promise<{ message: string }> {
    return handleApiCall(() => Api.post(`/calls/${callId}/end`));
  }

  /**
   * Get call history for the current user
   */
  static async getCallHistory(
    params: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Call[]> {
    return handleApiCall(() => Api.get("/calls/history", { params }));
  }

  /**
   * Get active call for the current user
   */
  static async getActiveCall(): Promise<{ active_call: Call | null }> {
    return handleApiCall(() => Api.get("/calls/active"));
  }
}
